import { aliasedTable, and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks, user } from "../db/schema/index.js";
import { ROLES, TASK_PRIORITIES, TASK_STATUSES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { resolvePagination, buildPaginationMeta } from "../utils/pagination.js";

const assignee = aliasedTable(user, "assignee");

const taskColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  assignedTo: tasks.assignedTo,
  priority: tasks.priority,
  status: tasks.status,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  assigneeName: assignee.name,
  assigneeEmail: assignee.email,
};

const shape = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  assignedTo: row.assignedTo,
  assignee: row.assigneeName ? { id: row.assignedTo, name: row.assigneeName, email: row.assigneeEmail } : null,
  priority: row.priority,
  status: row.status,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const sortColumns = {
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  title: tasks.title,
  priority: tasks.priority,
  status: tasks.status,
};

/**
 * Server-side search + filtering + pagination.
 * `forUserId` is set by the controller for employees so ownership is enforced
 * in SQL - an employee can never widen the result set from the client.
 */
export async function listTasks({
  search,
  status,
  priority,
  assignedTo,
  page,
  limit,
  sort = "createdAt",
  order = "desc",
  forUserId = null,
} = {}) {
  const { page: safePage, limit: safeLimit, offset } = resolvePagination({ page, limit });

  const filters = [];
  if (forUserId) filters.push(eq(tasks.assignedTo, forUserId));
  else if (assignedTo) filters.push(eq(tasks.assignedTo, assignedTo));
  if (status && TASK_STATUSES.includes(status)) filters.push(eq(tasks.status, status));
  if (priority && TASK_PRIORITIES.includes(priority)) filters.push(eq(tasks.priority, priority));

  if (search) {
    const term = `%${search}%`;
    const searchFilters = [
      ilike(tasks.title, term),
      ilike(tasks.description, term),
      ilike(assignee.name, term),
      sql`${tasks.status}::text ILIKE ${term}`,
      sql`${tasks.priority}::text ILIKE ${term}`,
    ];
    filters.push(or(...searchFilters));
  }

  const where = filters.length ? and(...filters) : undefined;
  const sortColumn = sortColumns[sort] ?? tasks.createdAt;
  const direction = order === "asc" ? asc : desc;

  const rows = await db
    .select(taskColumns)
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assignedTo, assignee.id))
    .where(where)
    .orderBy(direction(sortColumn))
    .limit(safeLimit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assignedTo, assignee.id))
    .where(where);

  const meta = buildPaginationMeta({ page: safePage, limit: safeLimit, total: count });

  return {
    tasks: rows.map(shape),
    currentPage: meta.currentPage,
    totalPages: meta.totalPages,
    totalTasks: meta.total,
    limit: meta.limit,
  };
}

export async function getTaskById(id) {
  const [row] = await db
    .select(taskColumns)
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assignedTo, assignee.id))
    .where(eq(tasks.id, id))
    .limit(1);

  if (!row) throw ApiError.notFound("Task not found.");
  return shape(row);
}

async function assertEmployeeExists(userId) {
  const [row] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) throw ApiError.badRequest("The selected employee does not exist.");
  if (row.role !== ROLES.EMPLOYEE) {
    throw ApiError.badRequest("Tasks can only be assigned to employees.");
  }
  return row;
}

export async function createTask({ title, description, assignedTo, priority, status, createdBy }) {
  const employee = await assertEmployeeExists(assignedTo);

  const [row] = await db
    .insert(tasks)
    .values({ title, description, assignedTo, priority, status, createdBy })
    .returning();

  return { task: { ...shape({ ...row, assigneeName: employee.name, assigneeEmail: employee.email }) }, employee };
}

export async function updateTask(id, changes) {
  const existing = await getTaskById(id);

  if (changes.assignedTo && changes.assignedTo !== existing.assignedTo) {
    await assertEmployeeExists(changes.assignedTo);
  }

  await db
    .update(tasks)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  const task = await getTaskById(id);
  return { task, previous: existing };
}

/** Status-only update. assignedTo is deliberately not touchable through this path. */
export async function updateTaskStatus(id, status) {
  const existing = await getTaskById(id);

  await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id));

  const task = await getTaskById(id);
  return { task, previousStatus: existing.status };
}

export async function getTaskStats({ forUserId = null } = {}) {
  const where = forUserId ? eq(tasks.assignedTo, forUserId) : undefined;

  const rows = await db
    .select({ status: tasks.status, count: sql`count(*)`.mapWith(Number) })
    .from(tasks)
    .where(where)
    .groupBy(tasks.status);

  const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0]));
  for (const row of rows) byStatus[row.status] = row.count;

  const total = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  return { byStatus, total };
}

export async function getPriorityStats({ forUserId = null } = {}) {
  const where = forUserId ? eq(tasks.assignedTo, forUserId) : undefined;

  const rows = await db
    .select({ priority: tasks.priority, count: sql`count(*)`.mapWith(Number) })
    .from(tasks)
    .where(where)
    .groupBy(tasks.priority);

  const byPriority = Object.fromEntries(TASK_PRIORITIES.map((p) => [p, 0]));
  for (const row of rows) byPriority[row.priority] = row.count;
  return byPriority;
}

export async function getRecentTasks({ forUserId = null, limit = 5 } = {}) {
  const where = forUserId ? eq(tasks.assignedTo, forUserId) : undefined;

  const rows = await db
    .select(taskColumns)
    .from(tasks)
    .leftJoin(assignee, eq(tasks.assignedTo, assignee.id))
    .where(where)
    .orderBy(desc(tasks.createdAt))
    .limit(limit);

  return rows.map(shape);
}
