import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import LoadingSpinner from "./LoadingSpinner.jsx";

/** Blocks anonymous visitors. The backend enforces this independently. */
export default function ProtectedRoute() {
  const { isAuthenticated, initialising } = useAuth();
  const location = useLocation();

  if (initialising) return <LoadingSpinner label="Checking your session..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
