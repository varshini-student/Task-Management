import MenuIcon from "@mui/icons-material/Menu";
import { Avatar, IconButton, Typography } from "@mui/material";
import { initials } from "../utils/format.js";

export default function Navbar({ title, user, onToggleSidebar }) {
  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconButton onClick={onToggleSidebar} aria-label="Toggle navigation" sx={{ display: { xs: "inline-flex", md: "none" }, border: "1px solid #e2e8f0", borderRadius: 2 }}><MenuIcon fontSize="small" /></IconButton>
        <Typography className="navbar__title" variant="h6" fontWeight={700}>{title}</Typography>
      </div>

      <div className="navbar__right">
        <div className="navbar__user">
          <strong>{user?.name || user?.email || "Account"}</strong>
          <span>{user?.email}</span>
        </div>
        <Avatar src={user?.image || undefined} sx={{ width: 34, height: 34, bgcolor: "#eef2ff", color: "#3730a3", fontSize: 12, fontWeight: 800 }}>{initials(user?.name || user?.email || "") || "U"}</Avatar>
      </div>
    </header>
  );
}
