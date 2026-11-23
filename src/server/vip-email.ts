import "server-only";

import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function sendVipVerificationEmail(email: string, name: string, verificationUrl: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const subject = "Verify your Ayoub Trader VIP account";
  const text = `Hello ${name}, verify your email address to access VIP Private Rooms: ${verificationUrl}`;
  const html = `<p>Hello ${escapeHtml(name)},</p><p>Verify your email address to access VIP Private Rooms.</p><p><a href="${escapeHtml(verificationUrl)}">Verify email</a></p><p>This link expires in 24 hours.</p>`;

  try {
    if (resendKey && from) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [email], subject, text, html }),
      });
      return response.ok;
    }
    if (!smtpHost || !smtpUser || !smtpPassword) return false;
    const port = Number(process.env.SMTP_PORT || 465);
    await nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: process.env.SMTP_SECURE?.toLowerCase() === "true" || (!process.env.SMTP_SECURE && port === 465),
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    }).sendMail({ from: process.env.RESEND_FROM_EMAIL ?? smtpUser, to: email, subject, text, html });
    return true;
  } catch (error) {
    console.error("[vip-auth] Verification email delivery failed:", error instanceof Error ? error.message : "unknown error");
    return false;
  }
}