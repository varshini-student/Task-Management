/**
 * End-to-end API + authorization test harness.
 *
 * Requires: a running server (npm run dev) and a seeded database (npm run seed).
 *   node scripts/test-api.js
 *
 * Covers the authentication, RBAC, search, pagination, validation and OTP
 * checks from the project specification.
 */
import { env } from "../config/env.js";

const BASE = `http://localhost:${env.port}`;
const ADMIN = { email: env.seed.adminEmail, password: env.seed.adminPassword };
const EMPLOYEE = { email: "aarti@example.com", password: "Employee@123" };

let passed = 0;
let failed = 0;

function check(name, condition, extra = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${extra ? ` -> ${extra}` : ""}`);
  }
}

/** Minimal cookie jar so each role keeps its own Better Auth session. */
function createClient() {
  let cookie = "";
  return async function call(method, path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = res.headers.getSetCookie?.() ?? [];
    if (setCookie.length) {
      cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data, raw: JSON.stringify(data ?? {}) };
  };
}

async function run() {
  const anon = createClient();
  const admin = createClient();
  const employee = createClient();

  console.log("\nHEALTH");
  const health = await anon("GET", "/api/health");
  check("GET /api/health returns 200", health.status === 200, `got ${health.status}`);

  console.log("\nAUTHENTICATION");
  check(
    "Unauthenticated request to /api/tasks is rejected",
    (await anon("GET", "/api/tasks")).status === 401
  );
  check(
    "Invalid credentials are rejected",
    (await anon("POST", "/api/auth/login", { email: ADMIN.email, password: "wrong-password" }))
      .status === 401
  );
  check(
    "Login validation rejects a malformed email",
    (await anon("POST", "/api/auth/login", { email: "not-an-email", password: "x" })).status === 400
  );

  const adminLogin = await admin("POST", "/api/auth/login", ADMIN);
  check("Admin login succeeds", adminLogin.status === 200, `got ${adminLogin.status}`);
  check("Admin role is ADMIN", adminLogin.data?.user?.role === "ADMIN");
  check("Login response contains no password field", !/"password"/.test(adminLogin.raw));

  const adminSession = await admin("GET", "/api/auth/session");
  check("Session endpoint reports the admin as authenticated", adminSession.data?.authenticated === true);

  const employeeLogin = await employee("POST", "/api/auth/login", EMPLOYEE);
  check("Employee login succeeds", employeeLogin.status === 200, `got ${employeeLogin.status}`);
  check("Employee role is EMPLOYEE", employeeLogin.data?.user?.role === "EMPLOYEE");
  const employeeId = employeeLogin.data?.user?.id;

  console.log("\nADMIN FEATURES");
  const employees = await admin("GET", "/api/employees?page=1&limit=10");
  check("Admin can list employees", employees.status === 200);
  check("Employee list is paginated", typeof employees.data?.totalPages === "number");
  check("Employee list exposes no passwords", !/"password"/.test(employees.raw));

  const created = await admin("POST", "/api/tasks", {
    title: "Automated test task",
    description: "Created by scripts/test-api.js to verify task creation.",
    assignedTo: employeeId,
    priority: "High",
    status: "Not Started",
  });
  check("Admin can create and assign a task", created.status === 201, `got ${created.status}`);
  const taskId = created.data?.task?.id;

  const invalidTask = await admin("POST", "/api/tasks", { title: "x" });
  check("Backend rejects an invalid task payload", invalidTask.status === 400);
  check("Validation errors are field-specific", Boolean(invalidTask.data?.errors));

  const search = await admin("GET", "/api/tasks?search=Automated%20test&page=1&limit=5");
  check("Server-side search returns matches", search.status === 200 && search.data.tasks.length > 0);
  check(
    "Pagination metadata is complete",
    ["currentPage", "totalPages", "totalTasks", "limit"].every((k) => k in search.data)
  );
  const emptySearch = await admin("GET", "/api/tasks?search=zzz-no-such-task-zzz");
  check("Empty search result is handled", emptySearch.data?.tasks?.length === 0);

  const stats = await admin("GET", "/api/dashboard/stats");
  check("Admin dashboard statistics load", stats.status === 200);
  check("Admin statistics include the employee count", typeof stats.data?.stats?.totalEmployees === "number");

  console.log("\nEMPLOYEE FEATURES");
  const ownTasks = await employee("GET", "/api/tasks?page=1&limit=50");
  check("Employee can list tasks", ownTasks.status === 200);
  check(
    "Employee sees only their own tasks",
    ownTasks.data?.tasks?.every((t) => t.assignedTo === employeeId) === true
  );

  const statusUpdate = await employee("PATCH", `/api/tasks/${taskId}/status`, {
    status: "In Progress",
  });
  check("Employee can update the status of their own task", statusUpdate.status === 200);
  check("Status actually changed", statusUpdate.data?.task?.status === "In Progress");
  check("Ownership is unchanged after a status update", statusUpdate.data?.task?.assignedTo === employeeId);

  const badStatus = await employee("PATCH", `/api/tasks/${taskId}/status`, { status: "Nope" });
  check("Invalid status value is rejected", badStatus.status === 400);

  console.log("\nSECURITY / RBAC");
  check(
    "Employee cannot list employees (admin API)",
    (await employee("GET", "/api/employees")).status === 403
  );
  check(
    "Employee cannot create tasks",
    (
      await employee("POST", "/api/tasks", {
        title: "Should not work",
        description: "Employee attempting to create a task.",
        assignedTo: employeeId,
        priority: "Low",
        status: "Not Started",
      })
    ).status === 403
  );
  check(
    "Employee cannot re-assign a task through PUT",
    (await employee("PUT", `/api/tasks/${taskId}`, { assignedTo: employeeId })).status === 403
  );

  // A task belonging to somebody else.
  const allTasks = await admin("GET", "/api/tasks?page=1&limit=100");
  const foreignTask = allTasks.data?.tasks?.find((t) => t.assignedTo !== employeeId);
  if (foreignTask) {
    check(
      "Employee cannot open another employee's task",
      (await employee("GET", `/api/tasks/${foreignTask.id}`)).status === 403
    );
    check(
      "Employee cannot update another employee's task status",
      (await employee("PATCH", `/api/tasks/${foreignTask.id}/status`, { status: "Completed" }))
        .status === 403
    );
  } else {
    console.log("  SKIP  no task owned by another employee was found");
  }

  const ownershipAttempt = await employee("PATCH", `/api/tasks/${taskId}/status`, {
    status: "Pending",
    assignedTo: "some-other-user-id",
  });
  check(
    "assignedTo in a status payload is ignored",
    ownershipAttempt.status === 200 && ownershipAttempt.data?.task?.assignedTo === employeeId
  );

  check(
    "Invalid task id is rejected",
    (await admin("GET", "/api/tasks/not-a-uuid")).status === 400
  );
  check(
    "Unknown employee id returns 404",
    (await admin("GET", "/api/employees/does-not-exist")).status === 404
  );

  console.log("\nOTP");
  const otpSend = await anon("POST", "/api/otp/send", { email: EMPLOYEE.email });
  check("OTP request is accepted", otpSend.status === 200, `got ${otpSend.status}`);
  check("OTP is never returned by the API", !/\b\d{6}\b/.test(otpSend.raw));
  check(
    "Resend is rate limited",
    (await anon("POST", "/api/otp/send", { email: EMPLOYEE.email })).status === 429
  );
  check(
    "Incorrect OTP is rejected",
    (await anon("POST", "/api/otp/verify", { email: EMPLOYEE.email, otp: "000000" })).status === 400
  );
  check(
    "Malformed OTP is rejected",
    (await anon("POST", "/api/otp/verify", { email: EMPLOYEE.email, otp: "abc" })).status === 400
  );

  console.log("\nSESSION TEARDOWN");
  check("Logout succeeds", (await employee("POST", "/api/auth/logout")).status === 200);
  const afterLogout = await employee("GET", "/api/tasks");
  check("Session is invalid after logout", afterLogout.status === 401, `got ${afterLogout.status}`);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("\nHarness could not run:", error.message);
  console.error("Is the server running on " + BASE + "?");
  process.exit(1);
});
