import { useEffect, useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import { ROLES } from "../utils/constants.js";
import { hasErrors, validateEmployee } from "../utils/validators.js";

const EMPTY = { name: "", email: "", password: "", role: ROLES.EMPLOYEE };

export default function EmployeeForm({
  mode = "create",
  initialValues,
  submitting = false,
  serverError = "",
  serverFieldErrors = null,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const isCreate = mode === "create";

  useEffect(() => {
    if (initialValues) setValues((current) => ({ ...current, ...initialValues }));
  }, [initialValues]);

  useEffect(() => {
    if (serverFieldErrors) setErrors((current) => ({ ...current, ...serverFieldErrors }));
  }, [serverFieldErrors]);

  const setField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validation = validateEmployee(values, { requirePassword: isCreate });
    setErrors(validation);
    if (hasErrors(validation)) return;

    const payload = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
    };
    if (isCreate) payload.password = values.password;
    onSubmit(payload);
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && <ErrorMessage message={serverError} />}

      <div className="field">
        <label className="field__label" htmlFor="name">
          Name
        </label>
        <input id="name" value={values.name} onChange={setField("name")} aria-invalid={Boolean(errors.name)} />
        {errors.name && <span className="field__error">{errors.name}</span>}
      </div>

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
        />
        {errors.email && <span className="field__error">{errors.email}</span>}
      </div>

      {isCreate && (
        <div className="field">
          <label className="field__label" htmlFor="password">
            Temporary password
          </label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={setField("password")}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
          />
          <span className="field__hint">At least 8 characters. Share it with the employee securely.</span>
          {errors.password && <span className="field__error">{errors.password}</span>}
        </div>
      )}

      <div className="field">
        <label className="field__label" htmlFor="role">
          Role
        </label>
        <select id="role" value={values.role} onChange={setField("role")}>
          <option value={ROLES.EMPLOYEE}>Employee</option>
          <option value={ROLES.ADMIN}>Admin</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Saving..." : isCreate ? "Create employee" : "Save changes"}
        </button>
        {onCancel && (
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
