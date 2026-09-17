import { Chip } from "@mui/material";

const VARIANTS = {
  "Not Started": { color: "default", sx: { bgcolor: "#f1f5f9", color: "#64748b" } },
  Pending: { color: "warning" },
  "In Progress": { color: "info" },
  Completed: { color: "success" },
};

export default function StatusBadge({ status }) {
  const variant = VARIANTS[status] || VARIANTS["Not Started"];
  return <Chip size="small" label={status} color={variant.color} sx={{ fontWeight: 700, height: 25, ...variant.sx }} />;
}
