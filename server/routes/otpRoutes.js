import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { sendOtpSchema, verifyOtpSchema } from "../utils/validators.js";
import { sendOtp, verify } from "../controllers/otpController.js";

const router = Router();

router.post("/send", validate(sendOtpSchema), sendOtp);
router.post("/verify", validate(verifyOtpSchema), verify);

export default router;
