import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = Router();

// Both roles may call this; the controller scopes the numbers to the caller.
router.get("/stats", requireAuth, getDashboardStats);

export default router;
