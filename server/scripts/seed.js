/**
 * Seeds one admin, three employees and a few tasks.
 * Safe to re-run: existing accounts are skipped, not duplicated.
 *
 *   npm run seed
 */
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks, user } from "../db/schema/index.js";
import { auth } from "../config/auth.js";
import { env } from "../config/env.js";
import { ROLES } from "../config/constants.js";
import { logger } from "../utils/logger.js";

const DEFAULT_EMPLOYEES = [
  { name: "Aarti Menon", email: "aarti@example.com", password: "Employee@123" },
  { name: "Rahul Verma", email: "rahul@example.com", password: "Employee@123" },
  { name: "Priya Nair", email: "priya@example.com", password: "Employee@123" },
];

async function findByEmail(email) {
  const [row] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  return row ?? null;
}

async function ensureAccount({ name, email, password, role }) {
  const existing = await findByEmail(email);
  if (existing) {
    if (existing.role !== role) {
      await db.update(user).set({ role, updatedAt: new Date() }).where(eq(user.id, existing.id));
      logger.info(`Role corrected for ${email} -> ${role}`);
    }
    logger.info(`Exists, skipped: ${email}`);
    return { ...existing, role };
  }

  const created = await auth.api.signUpEmail({ body: { name, email, password } });
  const id = created?.user?.id;
  if (!id) throw new Error(`Could not create ${email}`);

  const [row] = await db
    .update(user)
    .set({ role, emailVerified: true, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning();

  logger.info(`Created ${role}: ${email}`);
  return row;
}

async function run() {
  if (!env.seed.adminEmail || !env.seed.adminPassword) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in server/.env first.");
  }

  const admin = await ensureAccount({
    name: env.seed.adminName,
    email: env.seed.adminEmail.toLowerCase(),
    password: env.seed.adminPassword,
    role: ROLES.ADMIN,
  });

  const employees = [];
  for (const employee of DEFAULT_EMPLOYEES) {
    employees.push(await ensureAccount({ ...employee, role: ROLES.EMPLOYEE }));
  }

  const [{ count } = { count: 0 }] = await db
    .select({ count: tasks.id })
    .from(tasks)
    .limit(1);

  if (count) {
    logger.info("Tasks already present, skipping sample tasks.");
  } else {
    await db.insert(tasks).values([
      {
        title: "Build the login page",
        description: "Implement the responsive login screen and wire it to the auth API.",
        assignedTo: employees[0].id,
        createdBy: admin.id,
        priority: "High",
        status: "In Progress",
      },
      {
        title: "Design the dashboard layout",
        description: "Create the sidebar, navbar and stat card layout for the admin dashboard.",
        assignedTo: employees[1].id,
        createdBy: admin.id,
        priority: "Medium",
        status: "Not Started",
      },
      {
        title: "Write API documentation",
        description: "Document every REST endpoint with request and response examples.",
        assignedTo: employees[2].id,
        createdBy: admin.id,
        priority: "Low",
        status: "Pending",
      },
      {
        title: "Fix pagination on the task table",
        description: "Page numbers must stay in sync with the active search and filters.",
        assignedTo: employees[0].id,
        createdBy: admin.id,
        priority: "High",
        status: "Completed",
      },
    ]);
    logger.info("Inserted 4 sample tasks.");
  }

  logger.info("Seed complete.");
  logger.info(`Admin login: ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  logger.info("Employee logins: aarti@example.com, rahul@example.com, priya@example.com / Employee@123");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Seed failed:", error.message);
    process.exit(1);
  });
