import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { verifyDatabaseConnection } from "./db/index.js";
import { verifyEmailTransport } from "./services/emailService.js";
import { logger } from "./utils/logger.js";

/** Boot sequence: verify dependencies first, then accept traffic. */
async function start() {
  try {
    await verifyDatabaseConnection();
    logger.info("Neon PostgreSQL connection verified.");
  } catch (error) {
    logger.error("Could not connect to the database:", error.message);
    logger.error("Check DATABASE_URL in server/.env, then restart.");
    process.exit(1);
  }

  // SMTP problems are reported but never block the API.
  await verifyEmailTransport();

  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    logger.info(`CORS origin: ${env.clientUrl}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection:", reason));
}

start();
