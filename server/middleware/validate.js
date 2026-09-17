import { ApiError } from "../utils/ApiError.js";

/** Formats a ZodError into { field: message } for the frontend. */
export function formatZodError(error) {
  const details = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "form";
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}

/**
 * Validates req[source] against a Zod schema and replaces it with the parsed value.
 * Backend validation is independent of the frontend - it never trusts client input.
 */
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      return next(ApiError.badRequest("Please correct the highlighted fields.", formatZodError(result.error)));
    }
    if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    return next();
  };
