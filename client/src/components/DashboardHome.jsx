import { Link } from "react-router-dom";
import {
  AccessTime,
  Add,
  AssignmentOutlined,
  Autorenew,
  ChevronRight,
  GroupsOutlined,
  PendingActionsOutlined,
  Search,
  TaskAltOutlined,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import StatusBadge from "./StatusBadge.jsx";
import PriorityBadge from "./PriorityBadge.jsx";
import { formatDate, formatDateTime } from "../utils/format.js";
import { percentage } from "../utils/format.js";
import { TASK_STATUSES } from "../utils/constants.js";

const STAT_CONFIG = [
  { key: "totalTasks", label: "Total tasks", icon: AssignmentOutlined, tone: "teal" },
  { key: "pending", label: "Pending", icon: PendingActionsOutlined, tone: "coral" },
  { key: "inProgress", label: "In progress", icon: Autorenew, tone: "lilac" },
  { key: "completed", label: "Completed", icon: TaskAltOutlined, tone: "mint" },
];

function StatCard({ config, value, total }) {
  const Icon = config.icon;
  const progress = config.key === "totalTasks" ? 100 : percentage(value, total);
  return (
    <Card className={`dashboard-stat dashboard-stat--${config.tone}`} variant="outlined">
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Box className="dashboard-stat__top">
          <Box className="dashboard-stat__icon"><Icon fontSize="small" /></Box>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>{config.label}</Typography>
        </Box>
        <Typography className="dashboard-stat__value" variant="h3">{value}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinearProgress variant="determinate" value={progress} className="dashboard-stat__progress" />
          <Typography variant="caption" color="text.secondary">{config.key === "totalTasks" ? "All work" : `${progress}%`}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function TaskRow({ task, detailsPath }) {
  return (
    <Paper component={Link} to={`${detailsPath}/${task.id}`} className="dashboard-task" variant="outlined">
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography fontWeight={750} noWrap>{task.title}</Typography>
        <Typography variant="body2" color="text.secondary" noWrap>{task.description || "No description"}</Typography>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.assignee?.name && <Chip size="small" label={task.assignee.name} variant="outlined" sx={{ height: 25 }} />}
        </Stack>
      </Box>
      <Box className="dashboard-task__date">
        <Typography variant="caption" color="text.secondary">Updated</Typography>
        <Typography variant="caption" fontWeight={700}>{formatDate(task.updatedAt || task.createdAt)}</Typography>
        <ChevronRight fontSize="small" color="disabled" />
      </Box>
    </Paper>
  );
}

export default function DashboardHome({ user, data, isAdmin }) {
  const stats = data?.stats ?? {};
  const overview = data?.statusOverview ?? {};
  const total = stats.totalTasks || 0;
  const tasks = data?.recentTasks ?? [];
  const tasksPath = isAdmin ? "/admin/tasks" : "/employee/tasks";

  return (
    <Box className="dashboard-home">
      <Box className="dashboard-hero">
        <Box>
          <Typography className="dashboard-eyebrow">{isAdmin ? "Workspace overview" : "Personal workspace"}</Typography>
          <Typography variant="h1" className="dashboard-title">Task Dashboard</Typography>
          <Typography color="text.secondary">Welcome back, {user?.name || "there"}. Here is what needs your attention today.</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(new Date())}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" className="dashboard-actions">
          <TextField size="small" placeholder="Search tasks" inputProps={{ "aria-label": "Search tasks" }} InputProps={{ endAdornment: <Search color="action" fontSize="small" /> }} sx={{ width: 190, bgcolor: "background.paper" }} />
          <Tooltip title="Open all tasks"><IconButton component={Link} to={tasksPath} color="primary" aria-label="Open all tasks"><Search /></IconButton></Tooltip>
          {isAdmin && <Button component={Link} to="/admin/tasks/create" variant="contained" startIcon={<Add />}>Add task</Button>}
        </Stack>
      </Box>

      <Box className="dashboard-stat-grid">
        {STAT_CONFIG.map((config) => <StatCard key={config.key} config={config} value={stats[config.key] ?? 0} total={total} />)}
        {isAdmin && <Card className="dashboard-stat dashboard-stat--slate" variant="outlined"><CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}><Box className="dashboard-stat__top"><Box className="dashboard-stat__icon"><GroupsOutlined fontSize="small" /></Box><Typography variant="caption" color="text.secondary" fontWeight={700}>Team members</Typography></Box><Typography className="dashboard-stat__value" variant="h3">{stats.totalEmployees ?? 0}</Typography><Typography variant="caption" color="text.secondary">Active workspace users</Typography></CardContent></Card>}
      </Box>

      <Box className="dashboard-content-grid">
        <Box sx={{ minWidth: 0 }}>
          <Box className="dashboard-section-heading"><Box><Typography variant="h5">Task summary</Typography><Typography variant="body2" color="text.secondary">A quick view of work by status</Typography></Box><TrendingUp color="primary" /></Box>
          <Card variant="outlined" className="dashboard-summary-card">
            <CardContent sx={{ p: 2.5 }}>
              {TASK_STATUSES.map((status) => {
                const count = overview[status] ?? 0;
                const share = percentage(count, total);
                return <Box key={status} className="dashboard-summary-row"><Box className="dashboard-summary-label"><Typography variant="body2" fontWeight={700}>{status}</Typography><Typography variant="caption" color="text.secondary">{count} tasks</Typography></Box><LinearProgress variant="determinate" value={share} className={`dashboard-summary-progress dashboard-summary-progress--${status.toLowerCase().replace(" ", "-")}`} /><Typography variant="body2" fontWeight={700} color="text.secondary">{share}%</Typography></Box>;
              })}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">{Object.entries(data?.priorityOverview ?? {}).map(([priority, count]) => <Chip key={priority} label={`${priority}: ${count}`} size="small" variant="outlined" />)}</Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Box className="dashboard-section-heading"><Box><Typography variant="h5">Upcoming tasks</Typography><Typography variant="body2" color="text.secondary">Your latest work, ready to review</Typography></Box><Button component={Link} to={tasksPath} size="small" endIcon={<ChevronRight />}>View all</Button></Box>
          <Stack spacing={1.25}>{tasks.length ? tasks.map((task) => <TaskRow key={task.id} task={task} detailsPath={tasksPath} />) : <Card variant="outlined"><CardContent><Typography fontWeight={700}>No tasks yet</Typography><Typography variant="body2" color="text.secondary">New work will appear here when it is available.</Typography></CardContent></Card>}</Stack>
        </Box>
      </Box>

      <Card variant="outlined" className="dashboard-activity-card">
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Box className="dashboard-section-heading"><Box><Typography variant="h5">Task activity</Typography><Typography variant="body2" color="text.secondary">Recent updates from your workspace</Typography></Box><AccessTime color="primary" /></Box>
          <Box className="dashboard-activity-list">{tasks.slice(0, 5).map((task) => <Box className="dashboard-activity-item" key={task.id}><Box className="dashboard-activity-dot" /><Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" fontWeight={700} noWrap>{task.title}</Typography><Typography variant="caption" color="text.secondary">{task.status} {task.assignee?.name ? `· ${task.assignee.name}` : ""}</Typography></Box><Typography variant="caption" color="text.secondary">{formatDateTime(task.updatedAt || task.createdAt)}</Typography></Box>)}{!tasks.length && <Typography variant="body2" color="text.secondary">There is no recent task activity to show.</Typography>}</Box>
        </CardContent>
      </Card>
    </Box>
  );
}