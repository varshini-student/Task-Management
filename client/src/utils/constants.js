export const ROLES = { ADMIN: "ADMIN", EMPLOYEE: "EMPLOYEE" };

export const TASK_PRIORITIES = ["High", "Medium", "Low"];

export const TASK_STATUSES = ["Not Started", "Pending", "In Progress", "Completed"];

export const PAGE_SIZE = 10;

/** Landing route for each role after a successful sign-in. */
export const HOME_ROUTE = {
  [ROLES.ADMIN]: "/admin/dashboard",
  [ROLES.EMPLOYEE]: "/employee/dashboard",
};
