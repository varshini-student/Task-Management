import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleProtectedRoute from "./components/RoleProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import LoadingSpinner from "./components/LoadingSpinner.jsx";
import Login from "./pages/Login.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Tasks from "./pages/Tasks.jsx";
import CreateTask from "./pages/CreateTask.jsx";
import TaskDetails from "./pages/TaskDetails.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import EmployeeTasks from "./pages/EmployeeTasks.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { HOME_ROUTE, ROLES } from "./utils/constants.js";

/** Sends "/" to the dashboard that matches the signed-in role. */
function RoleHome() {
  const { user, initialising } = useAuth();
  if (initialising) return <LoadingSpinner label="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={HOME_ROUTE[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Requires a valid session */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RoleHome />} />

        <Route element={<DashboardLayout />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Admin only */}
        <Route element={<RoleProtectedRoute allow={[ROLES.ADMIN]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<Employees />} />
            <Route path="/admin/tasks" element={<Tasks />} />
            <Route path="/admin/tasks/create" element={<CreateTask />} />
            <Route path="/admin/tasks/:id" element={<TaskDetails />} />
          </Route>
        </Route>

        {/* Employee only */}
        <Route element={<RoleProtectedRoute allow={[ROLES.EMPLOYEE]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/tasks" element={<EmployeeTasks />} />
            <Route path="/employee/tasks/:id" element={<TaskDetails />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
