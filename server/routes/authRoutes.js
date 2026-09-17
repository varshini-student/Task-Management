import { Router } from "express";
import express from "express";
import { login, logout, getSession } from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../utils/validators.js";

/**
 * REST aliases for the documented auth endpoints.
 * Mounted BEFORE the Better Auth catch-all handler; unmatched paths fall
 * through to it. express.json() is applied per-route (not router-wide) so the
 * raw request stream stays untouched for Better Auth's own routes.
 */
const router = Router();

router.post("/login", express.json(), validate(loginSchema), login);
router.post("/logout", logout);
router.get("/session", getSession);

export default router;
