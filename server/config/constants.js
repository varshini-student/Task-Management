export const ROLES = Object.freeze({
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
});

export const TASK_PRIORITIES = Object.freeze(["High", "Medium", "Low"]);

export const TASK_STATUSES = Object.freeze([
  "Not Started",
  "Pending",
  "In Progress",
  "Completed",
]);

export const OTP_PURPOSES = Object.freeze({
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});
