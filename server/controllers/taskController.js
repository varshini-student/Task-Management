import { ROLES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createTask,
  getTaskById,
  listTasks,
  updateTask,
  updateTaskStatus,
} from "../services/taskService.js";
import { getAdminRecipients, getEmployeeById } from "../services/employeeService.js";
import { sendStatusUpdatedEmail, sendTaskAssignedEmail } from "../services/emailService.js";
import { logger } from "../utils/logger.js";

const isAdmin = (req) => req.user?.role === ROLES.ADMIN;

/** GET /api/tasks - admins see everything, employees only their own rows. */
export const getTasks = asyncHandler(async (req, res) => {
  const query = req.validatedQuery ?? {};
  const forUserId = isAdmin(req) ? null : req.user.id;

  const result = await listTasks({ ...query, forUserId });
  res.status(200).json({ success: true, ...result });
});

/** GET /api/tasks/:id - ownership checked on the server, not in the browser. */
export const getTask = asyncHandler(async (req, res) => {
  const task = await getTaskById(req.params.id);

  if (!isAdmin(req) && task.assignedTo !== req.user.id) {
    throw ApiError.forbidden("You can only open tasks assigned to you.");
  }

  res.status(200).json({ success: true, task });
});

/** POST /api/tasks - admin only. Sends the assignment email after the row is committed. */
export const postTask = asyncHandler(async (req, res) => {
  const { task, employee } = await createTask({ ...req.body, createdBy: req.user.id });

  let emailStatus = { sent: false };
  try {
    emailStatus = await sendTaskAssignedEmail({ employee, task });
  } catch (error) {
    logger.error("Assignment email threw unexpectedly:", error.message);
  }

  res.status(201).json({
    success: true,
    message: emailStatus.sent
      ? "Task created and the employee was notified by email."
      : "Task created. The notification email could not be delivered.",
    task,
    emailSent: Boolean(emailStatus.sent),
  });
});

/** PUT /api/tasks/:id - admin only. Reassignment is allowed here and nowhere else. */
export const putTask = asyncHandler(async (req, res) => {
  const { task, previous } = await updateTask(req.params.id, req.body);

  let emailSent = false;
  if (req.body.assignedTo && req.body.assignedTo !== previous.assignedTo) {
    try {
      const employee = await getEmployeeById(task.assignedTo);
      const result = await sendTaskAssignedEmail({ employee, task });
      emailSent = Boolean(result.sent);
    } catch (error) {
      logger.error("Reassignment email failed:", error.message);
    }
  }

  res.status(200).json({ success: true, message: "Task updated.", task, emailSent });
});

/**
 * PATCH /api/tasks/:id/status
 * An employee may update only their own task and only the status field.
 */
export const patchTaskStatus = asyncHandler(async (req, res) => {
  const existing = await getTaskById(req.params.id);

  if (!isAdmin(req) && existing.assignedTo !== req.user.id) {
    throw ApiError.forbidden("You can only update tasks assigned to you.");
  }

  const { task, previousStatus } = await updateTaskStatus(req.params.id, req.body.status);

  let emailSent = false;
  if (previousStatus !== task.status) {
    try {
      const admins = await getAdminRecipients();
      const employee = await getEmployeeById(task.assignedTo);
      const results = await Promise.all(
        admins.map((admin) =>
          sendStatusUpdatedEmail({
            adminEmail: admin.email,
            employee,
            task,
            previousStatus,
          })
        )
      );
      emailSent = results.some((result) => result.sent);
    } catch (error) {
      logger.error("Status update email failed:", error.message);
    }
  }

  res.status(200).json({
    success: true,
    message: "Status updated.",
    task,
    previousStatus,
    emailSent,
  });
});
