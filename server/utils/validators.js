import { z } from "zod";
import { ROLES, TASK_PRIORITIES, TASK_STATUSES, OTP_PURPOSES } from "../config/constants.js";

const email = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const name = z
  .string({ required_error: "Name is required." })
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(100, "Name must be 100 characters or fewer.");

const password = z
  .string({ required_error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "Password is required." }).min(1, "Password is required."),
});

export const createEmployeeSchema = z.object({
  name,
  email,
  password,
  role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE]).optional().default(ROLES.EMPLOYEE),
});

export const updateEmployeeSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required." })
    .trim()
    .min(3, "Task title must be at least 3 characters.")
    .max(150, "Task title must be 150 characters or fewer."),
  description: z
    .string({ required_error: "Task description is required." })
    .trim()
    .min(5, "Task description must be at least 5 characters.")
    .max(2000, "Task description must be 2000 characters or fewer."),
  assignedTo: z
    .string({ required_error: "Assigned employee is required." })
    .trim()
    .min(1, "Assigned employee is required."),
  priority: z.enum(TASK_PRIORITIES, {
    errorMap: () => ({ message: `Priority must be one of: ${TASK_PRIORITIES.join(", ")}.` }),
  }),
  status: z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${TASK_STATUSES.join(", ")}.` }),
  }),
});

export const updateTaskSchema = createTaskSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update." }
);

export const updateTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${TASK_STATUSES.join(", ")}.` }),
  }),
});

export const taskQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignedTo: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort: z.enum(["createdAt", "updatedAt", "title", "priority", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const employeeQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const sendOtpSchema = z.object({
  email,
  purpose: z
    .enum([OTP_PURPOSES.EMAIL_VERIFICATION, OTP_PURPOSES.PASSWORD_RESET])
    .optional()
    .default(OTP_PURPOSES.EMAIL_VERIFICATION),
});

export const verifyOtpSchema = z.object({
  email,
  otp: z
    .string({ required_error: "Enter the code from your email." })
    .trim()
    .regex(/^\d{4,8}$/, "Enter the numeric code from your email."),
  purpose: z
    .enum([OTP_PURPOSES.EMAIL_VERIFICATION, OTP_PURPOSES.PASSWORD_RESET])
    .optional()
    .default(OTP_PURPOSES.EMAIL_VERIFICATION),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid task id."),
});

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Invalid id."),
});
