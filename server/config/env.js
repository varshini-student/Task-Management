import "dotenv/config";

/**
 * Central, validated access to environment variables.
 * Nothing in the codebase reads process.env directly except this file.
 */

const required = (key) => {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing required environment variable: ${key}. Copy .env.example to server/.env and fill it in.`
    );
  }
  return value;
};

const optional = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: toInt(optional("PORT", "5000"), 5000),
  clientUrl: optional("CLIENT_URL", "http://localhost:5173"),

  databaseUrl: required("DATABASE_URL"),

  auth: {
    secret: required("BETTER_AUTH_SECRET"),
    url: optional("BETTER_AUTH_URL", "http://localhost:5000"),
  },

  smtp: {
    host: optional("SMTP_HOST", ""),
    port: toInt(optional("SMTP_PORT", "587"), 587),
    secure: optional("SMTP_SECURE", "false") === "true",
    user: optional("SMTP_USER", ""),
    pass: optional("SMTP_PASS", ""),
    from: optional("MAIL_FROM", "Task Management System <no-reply@example.com>"),
    adminNotificationEmail: optional("ADMIN_NOTIFICATION_EMAIL", ""),
  },

  otp: {
    pepper: optional("OTP_PEPPER", required("BETTER_AUTH_SECRET")),
    length: toInt(optional("OTP_LENGTH", "6"), 6),
    expiryMinutes: toInt(optional("OTP_EXPIRY_MINUTES", "10"), 10),
    resendCooldownSeconds: toInt(optional("OTP_RESEND_COOLDOWN_SECONDS", "60"), 60),
    maxSendsPerHour: toInt(optional("OTP_MAX_SENDS_PER_HOUR", "5"), 5),
    maxAttempts: toInt(optional("OTP_MAX_ATTEMPTS", "5"), 5),
  },

  seed: {
    adminName: optional("SEED_ADMIN_NAME", "System Admin"),
    adminEmail: optional("SEED_ADMIN_EMAIL", ""),
    adminPassword: optional("SEED_ADMIN_PASSWORD", ""),
  },
};

export const isProduction = env.nodeEnv === "production";
export const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
