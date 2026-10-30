import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const sessionCookie = "morocco-transfer-admin";

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function sessionSignature(userId: string, expiresAt: string) {
  const secret = process.env.TRANSFER_DASHBOARD_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set TRANSFER_DASHBOARD_SECRET to a random secret of at least 32 characters.");
  }
  return createHmac("sha256", secret).update(`${userId}.${expiresAt}`).digest("hex");
}

export async function getDashboardUser(request?: Request) {
  const tokens = request
    ? (request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${sessionCookie}=`))
      .map((part) => part.slice(sessionCookie.length + 1))
    : [(await cookies()).get(sessionCookie)?.value].filter(
      (token): token is string => Boolean(token),
    );

  for (const token of tokens) {
    const [userId, expiresAt, signature, extra] = token.split(".");
    if (!userId || !expiresAt || !signature || extra || !/^\d+$/.test(expiresAt)) continue;
    if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) continue;
    if (!safeEqual(signature, sessionSignature(userId, expiresAt))) continue;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, isActive: true },
    });
    if (user?.isActive) return user;
  }
  return null;
}

export async function getActiveAdmin(request?: Request) {
  const user = await getDashboardUser(request);
  return user?.role === "ADMIN" ? user : null;
}

export function getDashboardSessionSignature(userId: string, expiresAt: string) {
  return sessionSignature(userId, expiresAt);
}
