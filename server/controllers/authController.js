import { APIError } from "better-auth/api";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getUserById } from "../services/employeeService.js";

/**
 * Thin REST aliases over Better Auth so the documented endpoints
 * (/api/auth/login, /logout, /session) exist alongside Better Auth's own routes.
 * Session cookies are still issued and validated by Better Auth.
 */

const forwardSetCookie = (res, headers) => {
  const setCookie = headers?.getSetCookie?.() ?? [];
  if (setCookie.length) res.setHeader("set-cookie", setCookie);
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let response;
  try {
    response = await auth.api.signInEmail({
      body: { email, password },
      headers: fromNodeHeaders(req.headers),
      returnHeaders: true,
    });
  } catch (error) {
    if (error instanceof APIError) {
      throw ApiError.unauthorized("Email or password is incorrect.");
    }
    throw error;
  }

  const { headers, response: result } = response;
  forwardSetCookie(res, headers);

  if (!result?.user) throw ApiError.unauthorized("Email or password is incorrect.");

  const profile = await getUserById(result.user.id);

  res.status(200).json({
    success: true,
    message: "Signed in.",
    user: profile,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const response = await auth.api.signOut({
    headers: fromNodeHeaders(req.headers),
    returnHeaders: true,
  });

  forwardSetCookie(res, response.headers);
  res.status(200).json({ success: true, message: "Signed out." });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session?.user) {
    return res.status(200).json({ success: true, authenticated: false, user: null });
  }

  const profile = await getUserById(session.user.id);
  return res.status(200).json({ success: true, authenticated: true, user: profile });
});
