import { Chip } from "@mui/material";

const VARIANTS = { High: "danger", Medium: "warning", Low: "success" };

export default function PriorityBadge({ priority }) {
  const color = VARIANTS[priority] === "danger" ? "error" : VARIANTS[priority] || "default";
  return <Chip size="small" label={priority} color={color} sx={{ fontWeight: 700, height: 25 }} />;
}
