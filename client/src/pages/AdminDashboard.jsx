import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import TaskTable from "../components/TaskTable.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { getDashboardStats } from "../services/dashboardService.js";
import { getErrorMessage } from "../services/api.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { percentage } from "../utils/format.js";
import { TASK_STATUSES } from "../utils/constants.js";
import { AssignmentOutlined, Autorenew, GroupsOutlined, PendingActionsOutlined, TaskAltOutlined } from "@mui/icons-material";

export default function AdminDashboard() {
  useDocumentTitle("Admin dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getDashboardStats());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const stats = data?.stats ?? {};
  const overview = data?.statusOverview ?? {};
  const total = stats.totalTasks || 0;

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>Overview</h1>
          <p className="page__subtitle">Task progress and team activity at a glance.</p>
        </div>
        <Link className="button" to="/admin/tasks/create">
          Create task
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total tasks" value={total} accent="#4f46e5" icon={AssignmentOutlined} />
        <StatCard label="Pending" value={stats.pending ?? 0} accent="#f59e0b" icon={PendingActionsOutlined} />
        <StatCard label="In progress" value={stats.inProgress ?? 0} accent="#0284c7" icon={Autorenew} />
        <StatCard label="Completed" value={stats.completed ?? 0} accent="#10b981" icon={TaskAltOutlined} />
        <StatCard label="Total employees" value={stats.totalEmployees ?? 0} accent="#0891b2" icon={GroupsOutlined} />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card__header">
            <h2>Recent tasks</h2>
            <Link to="/admin/tasks">View all</Link>
          </div>
          <TaskTable
            tasks={data?.recentTasks ?? []}
            variant="admin"
            emptyTitle="No tasks yet"
            emptyDescription="Create your first task to get started."
            emptyAction={
              <Link className="button" to="/admin/tasks/create">
                Create task
              </Link>
            }
          />
        </section>

        <section className="card">
          <div className="card__header">
            <h2>Task status overview</h2>
          </div>
          <div className="card__body status-overview">
            {TASK_STATUSES.map((status) => {
              const count = overview[status] ?? 0;
              const share = percentage(count, total);
              return (
                <div className="status-overview__row" key={status}>
                  <div className="status-overview__meta">
                    <span>{status}</span>
                    <span className="cell-muted">
                      {count} ({share}%)
                    </span>
                  </div>
                  <div className="progress">
                    <div className="progress__bar" style={{ width: `${share}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="detail-list" style={{ marginTop: 6 }}>
              {Object.entries(data?.priorityOverview ?? {}).map(([priority, count]) => (
                <div className="detail-list__item" key={priority}>
                  <span className="detail-list__label">{priority} priority</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
