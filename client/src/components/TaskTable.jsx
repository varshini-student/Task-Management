import { Link } from "react-router-dom";
import { Button, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import StatusBadge from "./StatusBadge.jsx";
import PriorityBadge from "./PriorityBadge.jsx";
import EmptyState from "./EmptyState.jsx";
import { formatDate } from "../utils/format.js";
import { TASK_STATUSES } from "../utils/constants.js";

/**
 * Shared task table.
 * variant="admin"    -> shows the assignee column and a details link
 * variant="employee" -> shows the description and an inline status selector
 */
export default function TaskTable({
  tasks = [],
  variant = "admin",
  loading = false,
  emptyTitle = "No tasks found",
  emptyDescription = "Try a different search or filter.",
  emptyAction = null,
  detailsBasePath = "/admin/tasks",
  onStatusChange,
  updatingId = null,
}) {
  if (loading) {
    return <Stack spacing={1.5} sx={{ p: 2.5 }}>{[1, 2, 3].map((row) => <Skeleton key={row} variant="rounded" height={48} />)}</Stack>;
  }
  if (!tasks.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  const isAdmin = variant === "admin";

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ border: 0, boxShadow: "none", overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 760 }}>
        <TableHead><TableRow sx={{ bgcolor: "#f8fafc" }}>
          {[
            "Task title", isAdmin ? "Assigned employee" : "Description", "Priority", "Status", "Created", "Updated", "Actions",
          ].map((heading) => <TableCell key={heading} sx={{ color: "text.secondary", fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>{heading}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} hover>
              <TableCell><Typography fontSize={14} fontWeight={700}>{task.title}</Typography>{task.description && <Typography noWrap sx={{ maxWidth: 260 }} fontSize={12} color="text.secondary">{task.description}</Typography>}</TableCell>
              <TableCell>
                {isAdmin ? (
                  <>
                    <Typography fontSize={14}>{task.assignee?.name || "Unassigned"}</Typography>
                    <Typography fontSize={12} color="text.secondary">{task.assignee?.email}</Typography>
                  </>
                ) : (
                  <Typography noWrap sx={{ maxWidth: 260 }} fontSize={13} color="text.secondary" title={task.description}>{task.description || "No description"}</Typography>
                )}
              </TableCell>
              <TableCell><PriorityBadge priority={task.priority} /></TableCell>
              <TableCell><StatusBadge status={task.status} /></TableCell>
              <TableCell><Typography fontSize={13} color="text.secondary">{formatDate(task.createdAt)}</Typography></TableCell>
              <TableCell><Typography fontSize={13} color="text.secondary">{formatDate(task.updatedAt)}</Typography></TableCell>
              <TableCell><Stack direction="row" spacing={1} alignItems="center">
                  <Button component={Link} to={`${detailsBasePath}/${task.id}`} size="small" variant="outlined">View</Button>
                  {!isAdmin && onStatusChange && (
                    <select
                      value={task.status}
                      disabled={updatingId === task.id}
                      onChange={(event) => onStatusChange(task, event.target.value)}
                      aria-label={`Update status for ${task.title}`}
                      style={{ width: "auto", minWidth: 140 }}
                    >
                      {TASK_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  )}
                </Stack></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
