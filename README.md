# Task Management System

A role-based task management application with an Admin and an Employee experience.
Admins manage employees, create and assign tasks, and monitor progress. Employees see
only their own tasks and update their status. Both actions trigger email notifications.

---

## Overview

| Role         | Can do                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| **Admin**    | Manage employees, create and assign tasks, view/search/paginate all tasks, monitor progress, view dashboard statistics, receive status-update emails |
| **Employee** | Sign in, view only tasks assigned to them, open task details, update the status of their own tasks         |

Authorization is enforced **on the server**, not just in the UI. An employee who calls an
admin API directly receives `403`, and task queries are narrowed by `assignedTo` in SQL so
another employee's rows never reach the browser.

---

## Features

- Email/password authentication with Better Auth and database-backed sessions
- Role-based access control on both the frontend (route guards) and the backend (middleware)
- Employee management: list, search, paginate, view, create, update
- Task management: create, assign, re-assign, view, update, status-only updates
- Server-side search across task title, description, employee name, status and priority
- Server-side pagination that works together with search and filters
- Admin and Employee dashboards with live statistics and a status overview
- Email notifications on task assignment and on status change (Nodemailer + SMTP)
- OTP email verification: secure random codes, hashed storage, expiry, attempt limits, controlled resend
- Validation on both the client and the server
- Centralised error handling; internal errors are never leaked to the client
- Responsive UI with loading, empty, error and success states

---

## Technology stack

**Frontend** — React 18, Vite, React Router 6, Axios, plain CSS (no UI framework)
**Backend** — Node.js, Express 4
**Auth** — Better Auth (email + password, session cookies, RBAC)
**Database** — Neon PostgreSQL with Drizzle ORM and Drizzle migrations
**Email** — Nodemailer over SMTP
**Config** — dotenv

---

## Architecture

```
Browser (React)
  │  Axios, withCredentials  →  /api/*  (Vite dev proxy → :5000)
  ▼
Express
  ├── /api/auth/login|logout|session   REST aliases over Better Auth
  ├── /api/auth/*                      Better Auth node handler
  ├── routes/      HTTP surface, validation, role guards
  ├── controllers/ request/response shaping only
  ├── services/    business logic, email, OTP, all DB access
  └── db/          Drizzle schema + Neon connection
        ▼
      Neon PostgreSQL
```

Layer rules: routes never touch the database, controllers never build SQL, services never
read `req`/`res`. Nothing reads `process.env` except `config/env.js`.

---

## Folder structure

```
task-management-system/
├── client/
│   ├── scripts/check-imports.js     offline import/export check
│   ├── src/
│   │   ├── components/              StatCard, TaskTable, TaskForm, EmployeeForm,
│   │   │                            SearchBar, Pagination, PriorityBadge, StatusBadge,
│   │   │                            LoadingSpinner, ErrorMessage, EmptyState, Toast,
│   │   │                            ConfirmationModal, Navbar, Sidebar,
│   │   │                            ProtectedRoute, RoleProtectedRoute
│   │   ├── context/                 AuthContext, ToastContext, contexts.js
│   │   ├── hooks/                   useAuth, useToast, useDebounce, useDocumentTitle
│   │   ├── layouts/                 DashboardLayout
│   │   ├── pages/                   Login, VerifyEmail, AdminDashboard, Employees,
│   │   │                            Tasks, CreateTask, TaskDetails,
│   │   │                            EmployeeDashboard, EmployeeTasks, NotFound
│   │   ├── services/                api, authService, employeeService, taskService,
│   │   │                            dashboardService, otpService
│   │   ├── utils/                   constants, format, validators
│   │   ├── App.jsx                  routes + guards
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js               dev proxy /api → localhost:5000
│   └── package.json
│
├── server/
│   ├── config/                      env.js, auth.js (Better Auth), constants.js
│   ├── controllers/                 auth, employee, task, dashboard, otp
│   ├── routes/                      index, auth, employee, task, dashboard, otp
│   ├── middleware/                  authMiddleware, roleMiddleware, validate, errorMiddleware
│   ├── db/
│   │   ├── index.js                 Neon + Drizzle client
│   │   └── schema/                  auth.js, tasks.js, otp.js
│   ├── services/                    emailService, otpService, taskService, employeeService
│   ├── utils/                       ApiError, asyncHandler, logger, pagination, sanitize, validators
│   ├── scripts/                     seed.js, check-syntax.js, test-api.js
│   ├── drizzle/                     migrations
│   ├── app.js                       express app assembly
│   ├── server.js                    boot: verify DB, verify SMTP, listen
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Database

### Neon setup

1. Create a project at [neon.tech](https://neon.tech).
2. Open **Dashboard → Connection string** and copy the **pooled** connection string.
3. Paste it into `server/.env` as `DATABASE_URL` (keep `?sslmode=require`).

### Schema

| Table          | Purpose                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `user`         | id, name, email, `role` (`ADMIN`/`EMPLOYEE`), emailVerified, createdAt, updatedAt |
| `session`      | Better Auth sessions (token, expiresAt, userId → user.id, cascade)             |
| `account`      | Better Auth credentials; the hashed password lives here, never in `user`        |
| `verification` | Better Auth internal verification values                                       |
| `tasks`        | id (uuid), title, description, `assignedTo` → user.id, `createdBy` → user.id, priority, status, createdAt, updatedAt |
| `otp_codes`    | id, email, userId, purpose, `otpHash` (SHA-256 + pepper), attempts, expiresAt, consumedAt, createdAt |

`tasks.priority` is an enum (`High`, `Medium`, `Low`) and `tasks.status` is an enum
(`Not Started`, `Pending`, `In Progress`, `Completed`), so invalid values are rejected by
the database as well as by validation. Indexes exist on `assigned_to`, `status`,
`created_at` and on `(email, purpose)` for OTP lookups.

### Drizzle migrations

```bash
cd server
npm run db:generate   # regenerate SQL from db/schema (authoritative)
npm run db:migrate    # apply migrations to Neon
npm run db:studio     # optional: browse the data
```

`npm run db:push` is available for a quick schema sync during development.
A ready-to-apply `drizzle/0000_init.sql` is included; if you change the schema, run
`db:generate` so the migration folder and its snapshots stay in sync.

---

## Better Auth

Configured in `server/config/auth.js`:

- Drizzle adapter over the Neon database (`provider: "pg"`)
- Email + password enabled, minimum 8 characters, password hashing handled by Better Auth
- `role` registered as an additional user field with `input: false`, so a role can **never**
  be set from a public sign-up payload — only the server assigns roles
- Database sessions, 7-day expiry, refreshed daily
- httpOnly cookies, `sameSite: lax`, `secure` in production

Better Auth's own handler is mounted at `/api/auth/*`. Thin REST aliases
(`/api/auth/login`, `/logout`, `/session`) sit in front of it so the documented endpoints
exist; they delegate to `auth.api` and forward the session cookie.

---

## SMTP setup

Any SMTP provider works. For Gmail, create an **App Password** (not your account password):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=you@gmail.com
SMTP_PASS=your_16_character_app_password
MAIL_FROM="Task Management System <you@gmail.com>"
```

For local testing without a real inbox, [Mailtrap](https://mailtrap.io) works well.

If SMTP is not configured the API still runs: emails are skipped and logged with a warning
instead. **A failed email never rolls back or corrupts task data.**

---

## Environment variables

Copy `.env.example` to `server/.env` and fill it in. `server/.env` is git-ignored.

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `PORT` | no | defaults to `5000` |
| `NODE_ENV` | no | `development` / `production` |
| `CLIENT_URL` | no | CORS origin, defaults to `http://localhost:5173` |
| `DATABASE_URL` | **yes** | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | **yes** | long random string |
| `BETTER_AUTH_URL` | no | defaults to `http://localhost:5000` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | no | emails are skipped if absent |
| `MAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` | no | sender and fallback admin recipient |
| `OTP_PEPPER` | no | falls back to `BETTER_AUTH_SECRET` |
| `OTP_LENGTH`, `OTP_EXPIRY_MINUTES`, `OTP_RESEND_COOLDOWN_SECONDS`, `OTP_MAX_SENDS_PER_HOUR`, `OTP_MAX_ATTEMPTS` | no | OTP policy |
| `SEED_ADMIN_NAME` / `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | for seeding | used only by `npm run seed` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The client reads `VITE_API_URL` (optional, defaults to `/api`, which the Vite dev server
proxies to Express).

---

## Installation

```bash
# 1. Backend
cd server
cp ../.env.example .env        # then edit .env with your real values
npm install
npm run db:migrate             # create the tables in Neon
npm run seed                   # optional: one admin, three employees, four tasks
npm run dev                    # http://localhost:5000

# 2. Frontend (a second terminal)
cd client
npm install
npm run dev                    # http://localhost:5173
```

Open <http://localhost:5173>. Both halves run independently.

### Commands

**Backend**

| Command | Does |
| ------- | ---- |
| `npm run dev` | start with nodemon |
| `npm start` | start without watching |
| `npm run check` | offline parse + import/export check of every server file |
| `npm run test:api` | end-to-end API, RBAC, search, pagination and OTP tests |
| `npm run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle |
| `npm run seed` | seed accounts and sample tasks |

**Frontend**

| Command | Does |
| ------- | ---- |
| `npm run dev` | Vite dev server on 5173 |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the production build |
| `npm run lint` | ESLint |
| `npm run check` | offline import/export check of every client file |

### Seeded logins

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | value of `SEED_ADMIN_EMAIL` | value of `SEED_ADMIN_PASSWORD` |
| Employee | `aarti@example.com` | `Employee@123` |
| Employee | `rahul@example.com` | `Employee@123` |
| Employee | `priya@example.com` | `Employee@123` |

---

## API overview

All responses are JSON and include a `success` boolean. Errors return
`{ success: false, message, errors? }` where `errors` maps a field name to a message.

### Auth

| Method | Endpoint | Access | Notes |
| ------ | -------- | ------ | ----- |
| POST | `/api/auth/login` | public | sets the session cookie, returns the user |
| POST | `/api/auth/logout` | public | clears the session |
| GET | `/api/auth/session` | public | `{ authenticated, user }` |
| ALL | `/api/auth/*` | public | Better Auth's own endpoints |

### Employees — admin only

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| GET | `/api/employees?search=&page=&limit=` | paginated, searchable |
| GET | `/api/employees/options` | lightweight list for the assign dropdown |
| GET | `/api/employees/:id` | `404` when not found |
| POST | `/api/employees` | creates the account through Better Auth |
| PUT | `/api/employees/:id` | name / email / role |

### Tasks

| Method | Endpoint | Access | Notes |
| ------ | -------- | ------ | ----- |
| GET | `/api/tasks` | both | admins see all, employees only their own |
| GET | `/api/tasks/:id` | both | `403` if an employee does not own it |
| POST | `/api/tasks` | admin | assigns and emails the employee |
| PUT | `/api/tasks/:id` | admin | full update, including re-assignment |
| PATCH | `/api/tasks/:id/status` | both | status only; owner or admin; emails admins |

Query parameters for `GET /api/tasks`: `search`, `status`, `priority`, `assignedTo`,
`page`, `limit`, `sort`, `order`.

```
GET /api/tasks?search=frontend&status=Pending&page=1&limit=10

{
  "success": true,
  "tasks": [ ... ],
  "currentPage": 1,
  "totalPages": 5,
  "totalTasks": 50,
  "limit": 10
}
```

### Dashboard

`GET /api/dashboard/stats` — returns counts by status and priority, recent tasks, and (for
admins) the total employee count. The response is scoped to the caller's role.

### OTP

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| POST | `/api/otp/send` | `{ email }`; rate limited; the code is never in the response |
| POST | `/api/otp/verify` | `{ email, otp }` |

Status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500`.

---

## Authentication flow

```
Login form → POST /api/auth/login → Better Auth verifies the password
   → session row created, httpOnly cookie set
   → AuthContext stores the user, router redirects by role
        ADMIN    → /admin/dashboard
        EMPLOYEE → /employee/dashboard

Every later request sends the cookie automatically (withCredentials).
requireAuth reads the session server-side and attaches req.user.
requireRole compares req.user.role against the route's allowed roles.
Any 401 clears the client state and returns the user to /login.
```

On a page refresh the app calls `GET /api/auth/session` to restore the user. The user object
is never kept in localStorage, so it cannot be edited to fake a role.

---

## Admin features

- Dashboard: total tasks, not started, pending/in progress, completed, total employees,
  recent tasks, status overview with progress bars, priority breakdown
- Employees: searchable paginated table, details view, create and edit forms
- Tasks: searchable and filterable paginated table showing title, assignee, priority,
  status, created and updated dates, with per-row actions
- Create task: validated form with an employee dropdown; the employee is emailed on save
- Task details: full edit, including re-assignment

## Employee features

- Dashboard: own name, total assigned, not started, pending/in progress, completed, recent tasks
- My tasks: only their own rows (enforced in SQL), searchable, filterable, paginated
- Task details with description, priority, status and dates
- Status updates from the table or the detail page, behind a confirmation dialog;
  the admin is emailed. Re-assignment is not possible from any employee path.

---

## Testing instructions

```bash
# static checks (no database or network needed)
cd server && npm run check
cd ../client && npm run check && npm run build

# end-to-end API, RBAC, search, pagination and OTP tests
cd server
npm run dev          # terminal 1
npm run seed         # once, if you have not seeded
npm run test:api     # terminal 2
```

`scripts/test-api.js` signs in as both roles with separate cookie jars and asserts:

**Authentication** — unauthenticated requests rejected, invalid credentials rejected,
malformed email rejected, admin and employee login, session endpoint, logout invalidates
the session.

**Admin** — employee list and pagination, task creation and assignment, invalid payload
rejected with field errors, server-side search, empty search result, pagination metadata,
dashboard statistics.

**Employee** — task list scoped to the employee, status update succeeds, invalid status
rejected, ownership unchanged after a status update.

**Security** — employee cannot list employees, cannot create tasks, cannot re-assign via
`PUT`, cannot open or update another employee's task, `assignedTo` in a status payload is
ignored, invalid task id rejected, unknown employee id returns `404`.

**OTP** — code requested, code never returned by the API, resend rate limited, incorrect
and malformed codes rejected.

Manual checks worth doing once: the assignment email arrives, the status-change email
arrives, the UI is usable at mobile width, and an employee visiting `/admin/dashboard` is
redirected to their own dashboard.

---

## Security

- Passwords are hashed by Better Auth and stored in `account`; no endpoint ever returns a
  password field — user rows are shaped by `utils/sanitize.js` before leaving the server
- OTPs are stored only as a SHA-256 hash with a pepper, compared in constant time, expire,
  limit attempts, enforce a resend cooldown and an hourly cap, and are never returned or logged
- Every mutating route validates its input with Zod before it reaches a controller
- Employees' task queries are filtered by `assignedTo` in SQL; ownership is re-checked on
  every single-task read and status update
- `role` cannot be set through sign-up; only server code assigns roles
- CORS is restricted to `CLIENT_URL` with credentials enabled
- The error handler maps known failures to safe messages and logs stack traces server-side
  only; raw database errors never reach the client
- `.env` is git-ignored; `.env.example` carries no real credentials

---

## GitHub setup

```bash
cd task-management-system
git init
git add .
git commit -m "Task Management System"
git branch -M main
git remote add origin https://github.com/<you>/task-management-system.git
git push -u origin main
```

`.gitignore` already covers `node_modules`, `.env`, `dist` and `build`. Confirm with
`git status` that `server/.env` is **not** staged before your first push.
