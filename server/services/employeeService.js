import { and, asc, eq, ilike, or, sql, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { user } from "../db/schema/index.js";
import { auth } from "../config/auth.js";
import { ROLES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";
import { toPublicUser } from "../utils/sanitize.js";
import { resolvePagination, buildPaginationMeta } from "../utils/pagination.js";

const publicColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

export async function listEmployees({ search, page, limit } = {}) {
  const { page: safePage, limit: safeLimit, offset } = resolvePagination({ page, limit });

  const filters = [eq(user.role, ROLES.EMPLOYEE)];
  if (search) {
    filters.push(or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`)));
  }
  const where = and(...filters);

  const rows = await db
    .select(publicColumns)
    .from(user)
    .where(where)
    .orderBy(asc(user.name))
    .limit(safeLimit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(user)
    .where(where);

  return {
    employees: rows.map(toPublicUser),
    ...buildPaginationMeta({ page: safePage, limit: safeLimit, total: count }),
  };
}

/** All employees, unpaginated - used to populate the "assign to" dropdown. */
export async function listEmployeeOptions() {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, ROLES.EMPLOYEE))
    .orderBy(asc(user.name));
  return rows;
}

export async function getUserById(id) {
  const [row] = await db.select(publicColumns).from(user).where(eq(user.id, id)).limit(1);
  return toPublicUser(row);
}

export async function getEmployeeById(id) {
  const row = await getUserById(id);
  if (!row) throw ApiError.notFound("Employee not found.");
  return row;
}

export async function getAdminRecipients() {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.role, ROLES.ADMIN));
  return rows;
}

/**
 * Creates a user through Better Auth (so the password is hashed by Better Auth),
 * then sets the role server-side. Role can never come from a public sign-up payload.
 */
export async function createEmployee({ name, email, password, role = ROLES.EMPLOYEE }) {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing) throw ApiError.conflict("An account with that email already exists.");

  let created;
  try {
    created = await auth.api.signUpEmail({ body: { name, email, password } });
  } catch (error) {
    const message = error?.body?.message || error?.message || "Could not create the account.";
    throw ApiError.badRequest(message);
  }

  const newUserId = created?.user?.id;
  if (!newUserId) throw ApiError.internal("The account could not be created.");

  const [updated] = await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, newUserId))
    .returning(publicColumns);

  return toPublicUser(updated);
}

export async function updateEmployee(id, changes) {
  const [existing] = await db.select(publicColumns).from(user).where(eq(user.id, id)).limit(1);
  if (!existing) throw ApiError.notFound("Employee not found.");

  if (changes.email && changes.email !== existing.email) {
    const [clash] = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, changes.email), ne(user.id, id)))
      .limit(1);
    if (clash) throw ApiError.conflict("Another account already uses that email.");
  }

  const [updated] = await db
    .update(user)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning(publicColumns);

  return toPublicUser(updated);
}
