import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import TaskForm from "../components/TaskForm.jsx";
import { getTask, updateTask, updateTaskStatus } from "../services/taskService.js";
import { getEmployeeOptions } from "../services/employeeService.js";
import { getErrorMessage, getFieldErrors } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatDateTime } from "../utils/format.js";
import { ROLES, TASK_STATUSES } from "../utils/constants.js";

/**
 * Shared task detail view.
 * Admins may edit everything; employees may change only the status, and only
 * for their own task - the API rejects anything else regardless of the UI.
 */
export default function TaskDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [task, setTask] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(null);
  const [nextStatus, setNextStatus] = useState("");

  useDocumentTitle(task ? task.title : "Task");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const found = await getTask(id);
      setTask(found);
      if (isAdmin) {
        try {
          setEmployees(await getEmployeeOptions());
        } catch {
          setEmployees([]);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const saveTask = async (values) => {
    setSaving(true);
    setServerError("");
    setFieldErrors(null);
    try {
      const response = await updateTask(id, values);
      setTask(response.task);
      setEditing(false);
      toast.success("Task updated.");
    } catch (err) {
      setServerError(getErrorMessage(err));
      setFieldErrors(getFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  const applyStatus = async () => {
    setSaving(true);
    try {
      const response = await updateTaskStatus(id, nextStatus);
      setTask(response.task);
      toast.success(`Status changed to ${response.task.status}.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
      setNextStatus("");
    }
  };

  if (loading) return <LoadingSpinner label="Loading task..." />;
  if (error) {
    return (
      <div className="stack">
        <ErrorMessage message={error} onRetry={load} />
        <button type="button" className="button button--secondary" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }
  if (!task) return null;

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>{task.title}</h1>
          <p className="page__subtitle">
            Assigned to {task.assignee?.name || "-"} · Created {formatDateTime(task.createdAt)}
          </p>
        </div>
        <div className="form-actions">
          <button type="button" className="button button--secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          {isAdmin && !editing && (
            <button type="button" className="button" onClick={() => setEditing(true)}>
              Edit task
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <section className="card">
          <div className="card__header">
            <h2>Edit task</h2>
          </div>
          <div className="card__body">
            <TaskForm
              employees={employees}
              initialValues={{
                title: task.title,
                description: task.description,
                assignedTo: task.assignedTo,
                priority: task.priority,
                status: task.status,
              }}
              submitLabel="Save changes"
              submitting={saving}
              serverError={serverError}
              serverFieldErrors={fieldErrors}
              onSubmit={saveTask}
              onCancel={() => setEditing(false)}
            />
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="card__header">
              <h2>Task details</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
              </div>
            </div>
            <div className="card__body stack">
              <div className="field">
                <span className="detail-list__label">Description</span>
                <p>{task.description}</p>
              </div>
              <div className="detail-list">
                <div className="detail-list__item">
                  <span className="detail-list__label">Assigned employee</span>
                  <strong>{task.assignee?.name || "-"}</strong>
                  <span className="cell-muted">{task.assignee?.email}</span>
                </div>
                <div className="detail-list__item">
                  <span className="detail-list__label">Created</span>
                  <strong>{formatDateTime(task.createdAt)}</strong>
                </div>
                <div className="detail-list__item">
                  <span className="detail-list__label">Last updated</span>
                  <strong>{formatDateTime(task.updatedAt)}</strong>
                </div>
              </div>
            </div>
          </section>

          {!isAdmin && (
            <section className="card">
              <div className="card__header">
                <h2>Update status</h2>
              </div>
              <div className="card__body">
                <p className="inline-note" style={{ marginBottom: 12 }}>
                  Changing the status notifies your administrator by email. You cannot change who this
                  task is assigned to.
                </p>
                <div className="toolbar">
                  {TASK_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`button button--sm${status === task.status ? "" : " button--secondary"}`}
                      disabled={saving || status === task.status}
                      onClick={() => setNextStatus(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmationModal
        open={Boolean(nextStatus)}
        title="Update task status?"
        message={`"${task.title}" will change from ${task.status} to ${nextStatus}.`}
        confirmLabel="Update status"
        busy={saving}
        onConfirm={applyStatus}
        onCancel={() => setNextStatus("")}
      />
    </div>
  );
}
