import { ROLES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";

/** Allows the request only for the listed roles. Use after requireAuth. */
export const requireRole =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Your session has expired. Sign in again."));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("This area is restricted to administrators."));
    }
    return next();
  };

export const requireAdmin = requireRole(ROLES.ADMIN);
export const requireEmployee = requireRole(ROLES.EMPLOYEE);
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
