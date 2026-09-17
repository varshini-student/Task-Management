import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { getErrorMessage, getFieldErrors } from "../services/api.js";
import { hasErrors, validateLogin } from "../utils/validators.js";
import { HOME_ROUTE } from "../utils/constants.js";

export default function Login() {
  useDocumentTitle("Sign in");
  const { login, user, initialising } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) toast.info(location.state.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Already signed in: go straight to the right dashboard.
  if (!initialising && user) {
    return <Navigate to={HOME_ROUTE[user.role] || "/"} replace />;
  }

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validation = validateLogin(values);
    setErrors(validation);
    if (hasErrors(validation)) return;

    setSubmitting(true);
    setServerError("");
    try {
      const signedIn = await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast.success(`Welcome back, ${signedIn.name}.`);
      const target = location.state?.from?.pathname || HOME_ROUTE[signedIn.role] || "/";
      navigate(target, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
      setErrors(getFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <aside className="auth-showcase">
        <div className="auth-showcase__brand">
          <span className="sidebar__mark">TM</span>
          <span>Task Manager</span>
        </div>
        <div>
          <p className="eyebrow">WORK WITH CLARITY</p>
          <h1>Manage tasks. Track progress. Work better.</h1>
          <p className="auth-showcase__copy">
            Keep your team aligned with one focused workspace for everyday work.
          </p>
        </div>
        <ul className="auth-showcase__features">
          <li><span aria-hidden="true">✓</span> Task tracking</li>
          <li><span aria-hidden="true">✓</span> Team management</li>
          <li><span aria-hidden="true">✓</span> Progress monitoring</li>
        </ul>
      </aside>

      <div className="card auth-card">
        <div className="auth-card__brand">
          <span className="sidebar__logo">TM</span>
          <div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to your account</h2>
            <p className="page__subtitle">Use your work email and password to continue.</p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit} noValidate>
          {serverError && <ErrorMessage message={serverError} />}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={setField("email")}
              aria-invalid={Boolean(errors.email)}
              placeholder="you@company.com"
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={setField("password")}
              aria-invalid={Boolean(errors.password)}
              placeholder="Your password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && <span className="field__error">{errors.password}</span>}
          </div>

          <button type="submit" className="button button--block" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-card__footer">
          Need to verify your email? <Link to="/verify-email">Use a verification code</Link>
        </p>
      </div>
    </div>
  );
}
