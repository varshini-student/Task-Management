import { asyncHandler } from "../utils/asyncHandler.js";
import { requestOtp, verifyOtp } from "../services/otpService.js";

/** POST /api/otp/send - the code itself is never included in the response. */
export const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  const result = await requestOtp({ email, purpose });

  res.status(200).json({
    success: true,
    message: "A verification code has been sent to that email address.",
    expiresAt: result.expiresAt,
    resendAvailableInSeconds: result.resendAvailableInSeconds,
  });
});

/** POST /api/otp/verify */
export const verify = asyncHandler(async (req, res) => {
  const { email, otp, purpose } = req.body;
  const result = await verifyOtp({ email, otp, purpose });

  res.status(200).json({
    success: true,
    message: "Email verified.",
    verified: result.verified,
  });
});
