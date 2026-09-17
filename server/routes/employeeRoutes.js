import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createEmployeeSchema,
  employeeQuerySchema,
  idParamSchema,
  updateEmployeeSchema,
} from "../utils/validators.js";
import {
  getEmployee,
  getEmployeeOptions,
  getEmployees,
  postEmployee,
  putEmployee,
} from "../controllers/employeeController.js";

const router = Router();

// Every employee route is admin-only, enforced on the server.
router.use(requireAuth, requireAdmin);

router.get("/", validate(employeeQuerySchema, "query"), getEmployees);
router.get("/options", getEmployeeOptions);
router.get("/:id", validate(idParamSchema, "params"), getEmployee);
router.post("/", validate(createEmployeeSchema), postEmployee);
router.put("/:id", validate(idParamSchema, "params"), validate(updateEmployeeSchema), putEmployee);

export default router;
