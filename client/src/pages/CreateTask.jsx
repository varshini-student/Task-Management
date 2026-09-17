import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskForm from "../components/TaskForm.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { getEmployeeOptions } from "../services/employeeService.js";
import { createTask } from "../services/taskService.js";
import { getErrorMessage, getFieldErrors } from "../services/api.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

export default function CreateTask() {
  useDocumentTitle("Create task");
  const toast = useToast();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setEmployees(await getEmployeeOptions());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setServerError("");
    setFieldErrors(null);
    try {
      const response = await createTask(values);
      toast.success(
        response.emailSent
          ? "Task created and the employee was notified by email."
          : "Task created. The notification email could not be delivered."
      );
      navigate("/admin/tasks");
    } catch (error) {
      setServerError(getErrorMessage(error));
      setFieldErrors(getFieldErrors(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading employees..." />;

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>Create task</h1>
          <p className="page__subtitle">Assign work to an employee. They are emailed automatically.</p>
        </div>
      </div>

      {loadError && <ErrorMessage message={loadError} onRetry={loadEmployees} />}

      <section className="card">
        <div className="card__body">
          <TaskForm
            employees={employees}
            submitting={submitting}
            serverError={serverError}
            serverFieldErrors={fieldErrors}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/admin/tasks")}
          />
        </div>
      </section>
    </div>
  );
}
