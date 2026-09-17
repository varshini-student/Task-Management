/** Shapes a database user row into the public API representation (no secrets). */
export function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.emailVerified ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assignedTo: row.assignedTo,
    assignee: row.assignee ?? null,
    priority: row.priority,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
