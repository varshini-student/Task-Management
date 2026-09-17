import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import TaskTable from "../components/TaskTable.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { getDashboardStats } from "../services/dashboardService.js";
import { getErrorMessage } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { AssignmentOutlined, Autorenew, PendingActionsOutlined, TaskAltOutlined } from "@mui/icons-material";

/** Every number here is scoped to the signed-in employee by the backend. */
export default function EmployeeDashboard() {
  useDocumentTitle("My dashboard");
  const { user } = useAuth();
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

  if (loading) return <LoadingSpinner label="Loading your dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const stats = data?.stats ?? {};

  return (
    <div className="stack">
      <div className="page__header">
        <div>
          <h1>Hello, {user?.name}</h1>
          <p className="page__subtitle">Here is where your assigned work stands.</p>
        </div>
        <Link className="button button--secondary" to="/employee/tasks">
          View all my tasks
        </Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Total assigned" value={stats.totalTasks ?? 0} accent="#4f46e5" icon={AssignmentOutlined} />
        <StatCard label="Not started" value={stats.notStarted ?? 0} accent="#64748b" icon={AssignmentOutlined} />
        <StatCard
          label="Pending"
          value={stats.pending ?? 0}
          accent="#f59e0b"
          icon={PendingActionsOutlined}
        />
        <StatCard label="In progress" value={stats.inProgress ?? 0} accent="#0284c7" icon={Autorenew} />
        <StatCard label="Completed" value={stats.completed ?? 0} accent="#10b981" icon={TaskAltOutlined} />
      </div>

      <section className="card">
        <div className="card__header">
          <h2>Recent tasks</h2>
          <Link to="/employee/tasks">View all</Link>
        </div>
        <TaskTable
          tasks={data?.recentTasks ?? []}
          variant="employee"
          detailsBasePath="/employee/tasks"
          emptyTitle="No tasks assigned yet"
          emptyDescription="When an administrator assigns you a task it will appear here."
        />
      </section>
    </div>
  );
}
