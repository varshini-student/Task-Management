import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { sendOtp, verifyOtp } from "../services/otpService.js";
import { getErrorMessage, getFieldErrors } from "../services/api.js";
import { hasErrors, validateOtp } from "../utils/validators.js";

/**
 * OTP email verification.
 * The code is delivered by email only - it is never shown here or logged.
 */
export default function VerifyEmail() {
  useDocumentTitle("Verify email");
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState("request");
  const [values, setValues] = useState({ email: "", otp: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown that gates the resend button.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const requestCode = async (event) => {
    event?.preventDefault();

    const email = values.email.trim().toLowerCase();
    if (!email) {
      setErrors({ email: "Email is required." });
      return;
    }

    setBusy(true);
    setServerError("");
    try {
      const result = await sendOtp(email);
      setStep("verify");
      setCooldown(result.resendAvailableInSeconds ?? 60);
      toast.success("If that email is registered, a code is on its way.");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();

    const validation = validateOtp(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setBusy(true);
    setServerError("");
    try {
      await verifyOtp({ email: values.email.trim().toLowerCase(), otp: values.otp.trim() });
      toast.success("Email verified. You can sign in now.");
      navigate("/login", { replace: true, state: { message: "Email verified successfully." } });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="card auth-card">
        <div className="auth-card__brand">
          <span className="sidebar__logo">TM</span>
          <div>
            <h1>Verify your email</h1>
            <p className="page__subtitle">
              {step === "request" ? "We will email you a one-time code." : "Enter the code we emailed you."}
            </p>
          </div>
        </div>

        {step === "request" ? (
          <form className="form" onSubmit={requestCode} noValidate>
            {serverError && <ErrorMessage message={serverError} />}
            <div className="field">
              <label className="field__label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={setField("email")}
                aria-invalid={Boolean(errors.email)}
                placeholder="you@company.com"
              />
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>
            <button type="submit" className="button button--block" disabled={busy}>
              {busy ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={submitCode} noValidate>
            {serverError && <ErrorMessage message={serverError} />}
            <div className="field">
              <label className="field__label" htmlFor="otp">
                Verification code
              </label>
              <input
                id="otp"
                className="otp-input"
                inputMode="numeric"
                maxLength={8}
                value={values.otp}
                onChange={setField("otp")}
                aria-invalid={Boolean(errors.otp)}
                placeholder="000000"
                autoComplete="one-time-code"
              />
              <span className="field__hint">Sent to {values.email}. The code expires shortly.</span>
              {errors.otp && <span className="field__error">{errors.otp}</span>}
            </div>

            <button type="submit" className="button button--block" disabled={busy}>
              {busy ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              className="button button--secondary button--block"
              onClick={requestCode}
              disabled={busy || cooldown > 0}
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}

        <p className="auth-card__footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
