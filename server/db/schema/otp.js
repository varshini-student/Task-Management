import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * One-time passwords. Only the SHA-256 hash of the code is stored,
 * peppered with OTP_PEPPER. The plain code exists only in the email.
 */
export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    userId: text("user_id"),
    purpose: text("purpose").notNull(),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailPurposeIdx: index("otp_codes_email_purpose_idx").on(table.email, table.purpose),
    createdAtIdx: index("otp_codes_created_at_idx").on(table.createdAt),
  })
);
