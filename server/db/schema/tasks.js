import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth.js";

export const taskPriorityEnum = pgEnum("task_priority", ["High", "Medium", "Low"]);

export const taskStatusEnum = pgEnum("task_status", [
  "Not Started",
  "Pending",
  "In Progress",
  "Completed",
]);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    assignedTo: text("assigned_to")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    priority: taskPriorityEnum("priority").notNull().default("Medium"),
    status: taskStatusEnum("status").notNull().default("Not Started"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    assignedToIdx: index("tasks_assigned_to_idx").on(table.assignedTo),
    statusIdx: index("tasks_status_idx").on(table.status),
    createdAtIdx: index("tasks_created_at_idx").on(table.createdAt),
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(user, {
    fields: [tasks.assignedTo],
    references: [user.id],
    relationName: "assignee",
  }),
  creator: one(user, {
    fields: [tasks.createdBy],
    references: [user.id],
    relationName: "creator",
  }),
}));
