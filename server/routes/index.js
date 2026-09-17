import { Router } from "express";
import employeeRoutes from "./employeeRoutes.js";
import taskRoutes from "./taskRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import otpRoutes from "./otpRoutes.js";

/** All JSON API routes except /api/auth, which is mounted separately. */
const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

router.use("/employees", employeeRoutes);
router.use("/tasks", taskRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/otp", otpRoutes);

export default router;
