import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useToast } from "../hooks/useToast.js";

const TITLES = [
  { match: "/admin/dashboard", title: "Admin dashboard" },
  { match: "/admin/tasks/create", title: "Create task" },
  { match: "/admin/tasks", title: "Tasks" },
  { match: "/admin/employees", title: "Employees" },
  { match: "/employee/dashboard", title: "My dashboard" },
  { match: "/employee/tasks", title: "My tasks" },
  { match: "/profile", title: "Profile" },
  { match: "/settings", title: "Settings" },
];

/** Shared shell: sidebar + navbar + routed page content. */
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const title = TITLES.find((entry) => location.pathname.startsWith(entry.match))?.title || "Dashboard";

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success("You have been signed out.");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
      setConfirmLogout(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        role={user?.role}
        user={user}
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
        onLogout={() => setConfirmLogout(true)}
      />

      <div className="main">
        <Navbar title={title} user={user} onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="page">
          <Outlet />
        </main>
      </div>

      <ConfirmationModal
        open={confirmLogout}
        title="Sign out?"
        message="You will need to sign in again to access your dashboard."
        confirmLabel="Sign out"
        busy={signingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
