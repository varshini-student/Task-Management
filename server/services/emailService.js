import nodemailer from "nodemailer";
import { env, isSmtpConfigured } from "../config/env.js";
import { logger } from "../utils/logger.js";

let transporter = null;

function getTransporter() {
  if (!isSmtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

/** Optional boot-time check. Never throws - a bad SMTP setup must not stop the API. */
export async function verifyEmailTransport() {
  const tx = getTransporter();
  if (!tx) {
    logger.warn("SMTP is not configured. Emails will be skipped and logged instead.");
    return false;
  }
  try {
    await tx.verify();
    logger.info("SMTP transport verified.");
    return true;
  } catch (error) {
    logger.warn("SMTP transport could not be verified:", error.message);
    return false;
  }
}

/**
 * Sends an email. Returns { sent, skipped, error } and never throws,
 * so a mail failure can never corrupt or roll back task data.
 */
export async function sendEmail({ to, subject, html, text }) {
  const tx = getTransporter();

  if (!tx) {
    logger.warn(`Email skipped (SMTP not configured) -> to: ${to} | subject: ${subject}`);
    return { sent: false, skipped: true };
  }

  try {
    const info = await tx.sendMail({ from: env.smtp.from, to, subject, html, text });
    logger.info(`Email sent -> to: ${to} | subject: ${subject} | id: ${info.messageId}`);
    return { sent: true, skipped: false, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email failed -> to: ${to} | subject: ${subject} | ${error.message}`);
    return { sent: false, skipped: false, error: error.message };
  }
}

const formatDate = (value) =>
  new Date(value ?? Date.now()).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const layout = (heading, rows, note) => `
  <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.5">
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600">${heading}</h2>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #e2e7ec;background:#f6f7f9;width:180px;font-size:13px;color:#5b6b7c">${label}</td>
          <td style="padding:8px 12px;border:1px solid #e2e7ec;font-size:14px">${value ?? "-"}</td>
        </tr>`
        )
        .join("")}
    </table>
    ${note ? `<p style="margin:16px 0 0;font-size:13px;color:#5b6b7c">${note}</p>` : ""}
  </div>
`;

/** CASE 1 - a task was assigned to an employee. */
export async function sendTaskAssignedEmail({ employee, task }) {
  const rows = [
    ["Employee", employee.name],
    ["Task title", task.title],
    ["Description", task.description],
    ["Priority", task.priority],
    ["Status", task.status],
    ["Assigned date", formatDate(task.createdAt)],
  ];

  return sendEmail({
    to: employee.email,
    subject: `New task assigned: ${task.title}`,
    text: `Hello ${employee.name}, a new task "${task.title}" was assigned to you. Priority: ${task.priority}. Status: ${task.status}. Assigned on ${formatDate(task.createdAt)}.`,
    html: layout(
      `Hello ${employee.name}, you have a new task`,
      rows,
      "Sign in to your dashboard to open the task and update its status."
    ),
  });
}

/** CASE 2 - an employee changed the status of their task. */
export async function sendStatusUpdatedEmail({ adminEmail, employee, task, previousStatus }) {
  const to = adminEmail || env.smtp.adminNotificationEmail;
  if (!to) {
    logger.warn("Status update email skipped: no admin recipient configured.");
    return { sent: false, skipped: true };
  }

  const rows = [
    ["Employee", employee.name],
    ["Task title", task.title],
    ["Previous status", previousStatus],
    ["New status", task.status],
    ["Updated date", formatDate(task.updatedAt)],
  ];

  return sendEmail({
    to,
    subject: `Task status updated: ${task.title}`,
    text: `${employee.name} changed "${task.title}" from ${previousStatus} to ${task.status} on ${formatDate(task.updatedAt)}.`,
    html: layout("A task status was updated", rows),
  });
}

/** OTP delivery. The code exists only here and in the recipient's inbox. */
export async function sendOtpEmail({ to, name, otp, expiryMinutes }) {
  return sendEmail({
    to,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
    html: `
      <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16202b;line-height:1.5">
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:600">Verification code</h2>
        <p style="margin:0 0 16px;font-size:14px">${name ? `Hello ${name}, use` : "Use"} this code to verify your email address.</p>
        <p style="margin:0 0 16px;font-size:30px;font-weight:700;letter-spacing:6px">${otp}</p>
        <p style="margin:0;font-size:13px;color:#5b6b7c">The code expires in ${expiryMinutes} minutes. If you did not request it, ignore this email.</p>
      </div>
    `,
  });
}
