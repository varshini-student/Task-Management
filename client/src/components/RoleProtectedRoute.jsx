import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import { HOME_ROUTE } from "../utils/constants.js";

/**
 * Blocks signed-in users whose role is not allowed here and sends them to their
 * own dashboard. The API enforces the same rule independently.
 */
export default function RoleProtectedRoute({ allow = [] }) {
  const { user, initialising, isAuthenticated } = useAuth();

  if (initialising) return <LoadingSpinner label="Checking your access..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to={HOME_ROUTE[user.role] || "/login"} replace />;

  return <Outlet />;
}
