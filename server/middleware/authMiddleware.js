import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Reads the Better Auth session from the request cookies. Returns null if absent/invalid. */
export async function readSession(req) {
  try {
    return await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  } catch {
    return null;
  }
}

/** Rejects the request unless a valid Better Auth session exists. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const session = await readSession(req);

  if (!session?.user) {
    throw ApiError.unauthorized("Your session has expired. Sign in again.");
  }

  req.user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    emailVerified: session.user.emailVerified,
  };
  req.session = session.session;

  return next();
});

/** Attaches req.user when signed in, but never blocks the request. */
export const attachUser = asyncHandler(async (req, _res, next) => {
  const session = await readSession(req);
  if (session?.user) {
    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  }
  return next();
});
