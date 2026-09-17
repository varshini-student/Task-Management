import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  uuidParamSchema,
} from "../utils/validators.js";
import {
  getTask,
  getTasks,
  patchTaskStatus,
  postTask,
  putTask,
} from "../controllers/taskController.js";

const router = Router();

router.use(requireAuth);

// Admin + employee. The controller narrows the result set by ownership.
router.get("/", validate(taskQuerySchema, "query"), getTasks);
router.get("/:id", validate(uuidParamSchema, "params"), getTask);

// Admin only: creating, assigning and re-assigning tasks.
router.post("/", requireAdmin, validate(createTaskSchema), postTask);
router.put("/:id", requireAdmin, validate(uuidParamSchema, "params"), validate(updateTaskSchema), putTask);

// Status-only update. Employees may use it for their own tasks; assignedTo is
// not part of the schema, so ownership can never be changed through this route.
router.patch(
  "/:id/status",
  validate(uuidParamSchema, "params"),
  validate(updateTaskStatusSchema),
  patchTaskStatus
);

export default router;
