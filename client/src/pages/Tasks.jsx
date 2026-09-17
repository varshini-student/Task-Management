import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar.jsx";
import Pagination from "../components/Pagination.jsx";
import TaskTable from "../components/TaskTable.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { getTasks } from "../services/taskService.js";
import { getErrorMessage } from "../services/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { PAGE_SIZE, TASK_PRIORITIES, TASK_STATUSES } from "../utils/constants.js";

/** Admin task list. Search, filters and paging are all resolved server-side. */
export default function Tasks() {
  useDocumentTitle("Tasks");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState({ tasks: [], currentPage: 1, totalPages: 0, totalTasks: 0, limit: PAGE_SIZE });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebounce(search, 400);

  // Any change to a filter resets paging to the first page.
  useEffect(() => setPage(1), [debouncedSearch, status, priority]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTasks({
        search: debouncedSearch,
        status,
        priority,
        page,
        limit: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtersApplied = Boolean(debouncedSearch || status || priority);

  const clearAll = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setPage(1);
  };

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>All tasks</h1>
          <p className="page__subtitle">Search, filter and monitor every task in the system.</p>
        </div>
        <Link className="button" to="/admin/tasks/create">
          Create task
        </Link>
      </div>

      <section className="card">
        <div className="card__header">
          <div className="toolbar" style={{ flex: 1 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder="Search by title, employee, status or priority"
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
            <select
              className="filter-select"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              aria-label="Filter by priority"
            >
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((value) => (
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
              variant="admin"
              emptyTitle={filtersApplied ? "No matching tasks" : "No tasks yet"}
              emptyDescription={
                filtersApplied
                  ? "No task matches your search and filters."
                  : "Create a task to assign work to an employee."
              }
              emptyAction={
                filtersApplied ? (
                  <button type="button" className="button button--secondary" onClick={clearAll}>
                    Clear search
                  </button>
                ) : (
                  <Link className="button" to="/admin/tasks/create">
                    Create task
                  </Link>
                )
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
    </div>
  );
}
