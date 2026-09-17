import crypto from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { otpCodes, user } from "../db/schema/index.js";
import { env } from "../config/env.js";
import { OTP_PURPOSES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { sendOtpEmail } from "./emailService.js";
import { logger } from "../utils/logger.js";

/** Cryptographically secure numeric code of configured length. */
function generateOtp(length = env.otp.length) {
  const max = 10 ** length;
  return String(crypto.randomInt(0, max)).padStart(length, "0");
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(`${otp}:${env.otp.pepper}`).digest("hex");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Creates an OTP, stores only its hash, and emails the plain code.
 * The code is never returned, logged, or exposed in an API response.
 */
export async function requestOtp({ email, purpose = OTP_PURPOSES.EMAIL_VERIFICATION }) {
  const now = new Date();

  const [account] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (!account) {
    // Do not reveal whether the address exists.
    throw ApiError.badRequest("If that email is registered, a code has been sent.");
  }

  const [latest] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (latest) {
    const secondsSinceLast = (now.getTime() - new Date(latest.createdAt).getTime()) / 1000;
    if (secondsSinceLast < env.otp.resendCooldownSeconds) {
      const wait = Math.ceil(env.otp.resendCooldownSeconds - secondsSinceLast);
      throw ApiError.tooManyRequests(`Wait ${wait} seconds before requesting another code.`);
    }
  }

  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const [{ count: sendsLastHour }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        eq(otpCodes.purpose, purpose),
        gt(otpCodes.createdAt, oneHourAgo)
      )
    );

  if (sendsLastHour >= env.otp.maxSendsPerHour) {
    throw ApiError.tooManyRequests("Too many codes requested. Try again in an hour.");
  }

  // Invalidate any outstanding codes for this email/purpose.
  await db
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(
      and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt))
    );

  const otp = generateOtp();
  const expiresAt = new Date(now.getTime() + env.otp.expiryMinutes * 60 * 1000);

  await db.insert(otpCodes).values({
    email,
    userId: account.id,
    purpose,
    otpHash: hashOtp(otp),
    expiresAt,
  });

  const result = await sendOtpEmail({
    to: email,
    name: account.name,
    otp,
    expiryMinutes: env.otp.expiryMinutes,
  });

  if (result.skipped) {
    logger.warn(`OTP generated for ${email} but SMTP is not configured, so it was not delivered.`);
  }

  return {
    expiresAt,
    resendAvailableInSeconds: env.otp.resendCooldownSeconds,
    delivered: result.sent,
  };
}

/** Verifies a submitted code. Rejects wrong, expired, used and over-attempted codes. */
export async function verifyOtp({ email, otp, purpose = OTP_PURPOSES.EMAIL_VERIFICATION }) {
  const now = new Date();

  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(eq(otpCodes.email, email), eq(otpCodes.purpose, purpose), isNull(otpCodes.consumedAt))
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record) {
    throw ApiError.badRequest("No active code for this email. Request a new one.");
  }

  if (new Date(record.expiresAt).getTime() <= now.getTime()) {
    await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, record.id));
    throw ApiError.badRequest("That code has expired. Request a new one.");
  }

  if (record.attempts >= env.otp.maxAttempts) {
    await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, record.id));
    throw ApiError.tooManyRequests("Too many incorrect attempts. Request a new code.");
  }

  if (!safeEqual(record.otpHash, hashOtp(otp))) {
    await db
      .update(otpCodes)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodes.id, record.id));
    const remaining = env.otp.maxAttempts - (record.attempts + 1);
    throw ApiError.badRequest(
      remaining > 0
        ? `That code is incorrect. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
        : "That code is incorrect. Request a new code."
    );
  }

  await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, record.id));

  if (purpose === OTP_PURPOSES.EMAIL_VERIFICATION) {
    await db
      .update(user)
      .set({ emailVerified: true, updatedAt: now })
      .where(eq(user.email, email));
  }

  return { verified: true, purpose };
}

/** Housekeeping helper: removes codes older than a day. */
export async function purgeExpiredOtps() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await db.delete(otpCodes).where(sql`${otpCodes.createdAt} < ${cutoff}`);
}
