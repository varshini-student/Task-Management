import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { AddTask, AssignmentOutlined, DashboardOutlined, GroupsOutlined, Logout, SettingsOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import { Avatar, Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ROLES } from "../utils/constants.js";
import { initials } from "../utils/format.js";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: DashboardOutlined },
  { to: "/admin/tasks", label: "Tasks", icon: AssignmentOutlined },
  { to: "/admin/tasks/create", label: "Create task", icon: AddTask },
  { to: "/admin/employees", label: "Employees", icon: GroupsOutlined },
];

const EMPLOYEE_LINKS = [
  { to: "/employee/dashboard", label: "Dashboard", icon: DashboardOutlined },
  { to: "/employee/tasks", label: "My tasks", icon: AssignmentOutlined },
];

export default function Sidebar({ role, user, open, onNavigate, onLogout }) {
  const links = role === ROLES.ADMIN ? ADMIN_LINKS : EMPLOYEE_LINKS;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [accountAnchor, setAccountAnchor] = useState(null);
  const displayName = user?.name || user?.email || "Account";
  const displayEmail = user?.email || "No email available";
  const roleLabel = role === ROLES.ADMIN ? "Administrator" : "Employee";
  const closeAccount = () => setAccountAnchor(null);
  const handleSignOut = () => {
    closeAccount();
    onLogout();
  };

  return (
    <Drawer variant={isMobile ? "temporary" : "permanent"} open={isMobile ? open : true} onClose={onNavigate} ModalProps={{ keepMounted: true }} sx={{ width: 260, flexShrink: 0, "& .MuiDrawer-paper": { width: 260, boxSizing: "border-box", borderRight: "1px solid #e2e8f0" } }}>
      <Box sx={{ px: 2.5, py: 2.75, display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 2, bgcolor: "primary.main", color: "#fff", fontWeight: 800, letterSpacing: "-.05em" }}>TM</Box>
        <Box><Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>Task Manager</Typography><Typography variant="caption" color="text.secondary">Workspace</Typography></Box>
      </Box>
      <Typography sx={{ px: 2.5, mb: 1, color: "text.secondary", fontSize: 11, fontWeight: 800, letterSpacing: ".12em" }}>MAIN MENU</Typography>
      <List component="nav" aria-label="Main navigation" sx={{ px: 1.25, py: 0, display: "grid", gap: .5 }}>
        {links.map(({ to, label, icon: Icon }) => (
          <ListItemButton key={to} component={NavLink} to={to} end onClick={onNavigate} sx={{ borderRadius: 2, minHeight: 46, color: "text.secondary", "& .MuiListItemIcon-root": { minWidth: 38, color: "inherit" }, "&.active": { color: "primary.dark", bgcolor: "primary.light", fontWeight: 700 }, "&:hover": { bgcolor: "#f1f5f9", color: "text.primary" } }}>
            <ListItemIcon><Icon fontSize="small" /></ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: "auto", p: 1.5 }}>
        <Divider sx={{ mb: 1.25 }} />
        <ListItemButton onClick={(event) => setAccountAnchor(event.currentTarget)} aria-haspopup="menu" aria-expanded={Boolean(accountAnchor)} sx={{ px: 1.25, py: 1, borderRadius: 2, gap: 1.25, alignItems: "center", "&:hover": { bgcolor: "#f8fafc" } }}>
          <Avatar src={user?.image || undefined} sx={{ width: 38, height: 38, bgcolor: "primary.light", color: "primary.dark", fontSize: 14, fontWeight: 800 }}>{initials(displayName) || "U"}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}><Typography noWrap fontSize={13} fontWeight={700}>{displayName}</Typography><Typography noWrap fontSize={11} color="text.secondary">{displayEmail}</Typography></Box>
        </ListItemButton>
        <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={closeAccount} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "left" }} PaperProps={{ sx: { width: 260, mt: -1, border: "1px solid #e2e8f0" } }}>
          <Box sx={{ px: 2, py: 1.5, display: "flex", gap: 1.25, alignItems: "center" }}><Avatar src={user?.image || undefined} sx={{ bgcolor: "primary.light", color: "primary.dark" }}>{initials(displayName) || "U"}</Avatar><Box sx={{ minWidth: 0 }}><Typography noWrap fontSize={14} fontWeight={700}>{displayName}</Typography><Typography noWrap fontSize={12} color="text.secondary">{displayEmail}</Typography></Box></Box>
          <Divider />
          <MenuItem component={Link} to="/profile" onClick={closeAccount}><PersonOutlineOutlined fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />Profile</MenuItem>
          <MenuItem component={Link} to="/settings" onClick={closeAccount}><SettingsOutlined fontSize="small" sx={{ mr: 1.5, color: "text.secondary" }} />Settings</MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut} sx={{ color: "error.main", fontWeight: 700 }}><Logout fontSize="small" sx={{ mr: 1.5 }} />Sign out</MenuItem>
        </Menu>
        <Typography sx={{ px: 1.25, pt: .75, fontSize: 11, color: "text.secondary" }}>{roleLabel}</Typography>
      </Box>
    </Drawer>
  );
}
