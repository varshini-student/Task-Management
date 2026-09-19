import { useCallback, useEffect, useState } from "react";
import DashboardHome from "../components/DashboardHome.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { getDashboardStats } from "../services/dashboardService.js";
import { getErrorMessage } from "../services/api.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { useAuth } from "../hooks/useAuth.js";

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

  return <DashboardHome user={user} data={data} isAdmin={false} />;
}
