"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearDashboardSession, getActiveAdmin } from "./dashboard-auth";
import { hashVipPassword, verifyVipPassword } from "./vip-auth";
import { prisma } from "./prisma";

async function requireAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return admin;
}

export async function verifyAdminCurrentPassword(password: string) {
  const admin = await requireAdmin();
  if (typeof password !== "string" || !password || password.length > 512) return { valid: false };
  const user = await prisma.user.findUnique({ where: { id: admin.id }, select: { isActive: true, passwordHash: true } });
  return { valid: Boolean(user?.isActive && await verifyVipPassword(password, user.passwordHash)) };
}

export async function updateAdminAccount(input: { username: string; email: string; currentPassword: string; newPassword: string; confirmation: string }) {
  const admin = await requireAdmin();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,99}$/.test(username)) throw new Error("Use 3 to 100 letters, numbers, dots, underscores, or hyphens for your username.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (input.currentPassword.length > 512 || input.newPassword.length > 128 || input.confirmation.length > 128) throw new Error("Password input is too long.");
  if (input.newPassword && input.newPassword.length < 12) throw new Error("Use at least 12 characters for a new administrator password.");
  if (input.newPassword !== input.confirmation) throw new Error("New passwords do not match.");
  if (!input.currentPassword) throw new Error("Enter your current password to confirm account changes.");
  const user = await prisma.user.findUnique({ where: { id: admin.id }, select: { passwordHash: true, isActive: true, username: true, email: true } });
  if (!user?.isActive || !(await verifyVipPassword(input.currentPassword, user.passwordHash))) throw new Error("Your current password did not match.");
  const duplicate = await prisma.user.findFirst({ where: { id: { not: admin.id }, OR: [{ username }, ...(email ? [{ email }] : [])] }, select: { id: true } });
  if (duplicate) throw new Error("That username or email is already in use.");
  const changed = username !== user.username || email !== (user.email ?? "") || Boolean(input.newPassword);
  if (!changed) throw new Error("There are no account changes to save.");
  await prisma.$transaction(async (database) => {
    await database.user.update({ where: { id: admin.id }, data: { username, email: email || null, ...(input.newPassword ? { passwordHash: await hashVipPassword(input.newPassword) } : {}) } });
    await database.vipAuditLog.create({ data: { actorId: admin.id, action: "ADMIN_ACCOUNT_UPDATED", subjectId: admin.id, details: { usernameChanged: username !== user.username, emailChanged: email !== (user.email ?? ""), passwordChanged: Boolean(input.newPassword) } } });
  });
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return { ok: true as const, username, email: email || null };
}

export async function signOutAdmin() {
  await clearDashboardSession();
  revalidatePath("/dashboard");
  redirect("/vip/login");
}