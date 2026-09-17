import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, schema } from "../db/index.js";
import { env, isProduction } from "./env.js";
import { ROLES } from "./constants.js";

/**
 * Better Auth instance (email + password, database sessions).
 * The HTTP handler is mounted in server.js at /api/auth/*.
 */
export const auth = betterAuth({
  appName: "Task Management System",
  secret: env.auth.secret,
  baseURL: env.auth.url,
  basePath: "/api/auth",

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    // Email verification is handled by the OTP service (services/otpService.js).
    requireEmailVerification: false,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: ROLES.EMPLOYEE,
        // Never settable from a public sign-up payload; only the server sets roles.
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once a day
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProduction,
      httpOnly: true,
    },
  },

  trustedOrigins: [env.clientUrl, env.auth.url],
});
