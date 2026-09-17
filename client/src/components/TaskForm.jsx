import { useEffect, useState } from "react";
import ErrorMessage from "./ErrorMessage.jsx";
import { TASK_PRIORITIES, TASK_STATUSES } from "../utils/constants.js";
import { hasErrors, validateTask } from "../utils/validators.js";

const EMPTY = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "Medium",
  status: "Not Started",
};

/** Create/edit form for a task. Validated here and again on the server. */
export default function TaskForm({
  employees = [],
  initialValues,
  submitLabel = "Create task",
  submitting = false,
  serverError = "",
  serverFieldErrors = null,
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

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
    const validation = validateTask(values);
    setErrors(validation);
    if (hasErrors(validation)) return;
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      assignedTo: values.assignedTo,
      priority: values.priority,
      status: values.status,
    });
  };

  const fieldError = (name) => errors[name];

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {serverError && <ErrorMessage message={serverError} />}

      <div className="field">
        <label className="field__label" htmlFor="title">
          Task title
        </label>
        <input
          id="title"
          value={values.title}
          onChange={setField("title")}
          aria-invalid={Boolean(fieldError("title"))}
          placeholder="e.g. Build the login page"
        />
        {fieldError("title") && <span className="field__error">{fieldError("title")}</span>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="description">
          Task description
        </label>
        <textarea
          id="description"
          value={values.description}
          onChange={setField("description")}
          aria-invalid={Boolean(fieldError("description"))}
          placeholder="What needs to be done?"
        />
        {fieldError("description") && <span className="field__error">{fieldError("description")}</span>}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="assignedTo">
          Assign to employee
        </label>
        <select
          id="assignedTo"
          value={values.assignedTo}
          onChange={setField("assignedTo")}
          aria-invalid={Boolean(fieldError("assignedTo"))}
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} ({employee.email})
            </option>
          ))}
        </select>
        {!employees.length && (
          <span className="field__hint">No employees yet. Add one from the Employees page first.</span>
        )}
        {fieldError("assignedTo") && <span className="field__error">{fieldError("assignedTo")}</span>}
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="priority">
            Priority
          </label>
          <select id="priority" value={values.priority} onChange={setField("priority")}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          {fieldError("priority") && <span className="field__error">{fieldError("priority")}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="status">
            Status
          </label>
          <select id="status" value={values.status} onChange={setField("status")}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {fieldError("status") && <span className="field__error">{fieldError("status")}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
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
