import { TASK_PRIORITIES, TASK_STATUSES } from "./constants.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side validation for fast feedback.
 * The backend validates independently - this is never the only check.
 */
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export function validateTask({ title, description, assignedTo, priority, status }) {
  const errors = {};
  if (!title?.trim()) errors.title = "Task title is required.";
  else if (title.trim().length < 3) errors.title = "Task title must be at least 3 characters.";
  if (!description?.trim()) errors.description = "Task description is required.";
  else if (description.trim().length < 5) errors.description = "Task description must be at least 5 characters.";
  if (!assignedTo) errors.assignedTo = "Select an employee to assign this task to.";
  if (!priority) errors.priority = "Priority is required.";
  else if (!TASK_PRIORITIES.includes(priority)) errors.priority = "Select a valid priority.";
  if (!status) errors.status = "Status is required.";
  else if (!TASK_STATUSES.includes(status)) errors.status = "Select a valid status.";
  return errors;
}

export function validateEmployee({ name, email, password }, { requirePassword = false } = {}) {
  const errors = {};
  if (!name?.trim()) errors.name = "Name is required.";
  else if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (requirePassword) {
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

export function validateOtp({ email, otp }) {
  const errors = {};
  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!otp?.trim()) errors.otp = "Enter the code from your email.";
  else if (!/^\d{4,8}$/.test(otp.trim())) errors.otp = "The code is numeric only.";
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;
