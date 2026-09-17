import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Cookie-based sessions require an explicit origin + credentials.
  app.use(
    cors({
      origin: [env.clientUrl],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // 1. Documented REST aliases (/api/auth/login, /logout, /session).
  app.use("/api/auth", authRoutes);

  // 2. Better Auth's own handler for everything else under /api/auth.
  //    It must read the raw body, so it is mounted before express.json().
  app.all("/api/auth/*", toNodeHandler(auth));

  // 3. JSON body parsing for the rest of the API.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
