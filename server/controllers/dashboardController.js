import { ROLES } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPriorityStats,
  getRecentTasks,
  getTaskStats,
} from "../services/taskService.js";
import { listEmployees } from "../services/employeeService.js";

/** GET /api/dashboard/stats - shape depends on the caller's role. */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const admin = req.user.role === ROLES.ADMIN;
  const forUserId = admin ? null : req.user.id;

  const [{ byStatus, total }, byPriority, recentTasks] = await Promise.all([
    getTaskStats({ forUserId }),
    getPriorityStats({ forUserId }),
    getRecentTasks({ forUserId, limit: 5 }),
  ]);

  const stats = {
    notStarted: byStatus["Not Started"],
    pending: byStatus.Pending,
    inProgress: byStatus["In Progress"],
    completed: byStatus.Completed,
    pendingOrInProgress: byStatus.Pending + byStatus["In Progress"],
    totalTasks: total,
  };

  if (admin) {
    const employees = await listEmployees({ page: 1, limit: 1 });
    stats.totalEmployees = employees.total;
  }

  res.status(200).json({
    success: true,
    role: req.user.role,
    user: { id: req.user.id, name: req.user.name, email: req.user.email },
    stats,
    statusOverview: byStatus,
    priorityOverview: byPriority,
    recentTasks,
  });
});
