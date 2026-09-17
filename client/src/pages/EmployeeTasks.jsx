import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import Pagination from "../components/Pagination.jsx";
import TaskTable from "../components/TaskTable.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { getTasks, updateTaskStatus } from "../services/taskService.js";
import { getErrorMessage } from "../services/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useToast } from "../hooks/useToast.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { PAGE_SIZE, TASK_STATUSES } from "../utils/constants.js";

/**
 * The employee's own task list.
 * The API returns only tasks assigned to the signed-in user - the browser
 * never receives anybody else's rows.
 */
export default function EmployeeTasks() {
  useDocumentTitle("My tasks");
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ tasks: [], currentPage: 1, totalPages: 0, totalTasks: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingChange, setPendingChange] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => setPage(1), [debouncedSearch, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setResult(await getTasks({ search: debouncedSearch, status, page, limit: PAGE_SIZE }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmStatusChange = async () => {
    if (!pendingChange) return;
    const { task, nextStatus } = pendingChange;

    setUpdatingId(task.id);
    try {
      await updateTaskStatus(task.id, nextStatus);
      toast.success(`"${task.title}" is now ${nextStatus}.`);
      setPendingChange(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPendingChange(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtersApplied = Boolean(debouncedSearch || status);

  const clearAll = () => {
    setSearch("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>My tasks</h1>
          <p className="page__subtitle">Only tasks assigned to you are shown here.</p>
        </div>
      </div>

      <section className="card">
        <div className="card__header">
          <div className="toolbar" style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search my tasks"
            />
            <select
              className="filter-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {TASK_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            {filtersApplied && (
              <button type="button" className="button button--secondary button--sm" onClick={clearAll}>
                Clear
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="card__body">
            <ErrorMessage message={error} onRetry={load} />
          </div>
        ) : (
          <>
            <TaskTable
              tasks={result.tasks}
              loading={loading}
              variant="employee"
              detailsBasePath="/employee/tasks"
              updatingId={updatingId}
              onStatusChange={(task, nextStatus) => setPendingChange({ task, nextStatus })}
              emptyTitle={filtersApplied ? "No matching tasks" : "No tasks assigned yet"}
              emptyDescription={
                filtersApplied
                  ? "No task of yours matches this search."
                  : "When an administrator assigns you a task it will appear here."
              }
              emptyAction={
                filtersApplied ? (
                  <button type="button" className="button button--secondary" onClick={clearAll}>
                    Clear search
                  </button>
                ) : null
              }
            />
            <Pagination
              currentPage={result.currentPage}
              totalPages={result.totalPages}
              totalItems={result.totalTasks}
              limit={result.limit}
              itemLabel="tasks"
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <ConfirmationModal
        open={Boolean(pendingChange)}
        title="Update task status?"
        message={
          pendingChange
            ? `"${pendingChange.task.title}" will change from ${pendingChange.task.status} to ${pendingChange.nextStatus}. Your administrator will be notified by email.`
            : ""
        }
        confirmLabel="Update status"
        busy={Boolean(updatingId)}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingChange(null)}
      />
    </div>
  );
}
