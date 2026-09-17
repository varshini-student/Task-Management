import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { formatZodError } from "./validate.js";
import { logger } from "../utils/logger.js";
import { isProduction } from "../config/env.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Centralised error handler. Raw internal errors never reach the client. */
export function errorHandler(err, req, res, _next) {
  let statusCode = 500;
  let message = "Something went wrong. Try again.";
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Please correct the highlighted fields.";
    details = formatZodError(err);
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "The request body is not valid JSON.";
  } else if (err?.code === "23505") {
    statusCode = 409;
    message = "That record already exists.";
  } else if (err?.code === "23503") {
    statusCode = 400;
    message = "A referenced record does not exist.";
  } else if (err?.code === "22P02") {
    statusCode = 400;
    message = "One of the supplied values has the wrong format.";
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err?.stack || err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${message}`);
  }

  const payload = { success: false, message };
  if (details) payload.errors = details;
  if (!isProduction && statusCode >= 500) payload.debug = String(err?.message ?? err);

  res.status(statusCode).json(payload);
}
