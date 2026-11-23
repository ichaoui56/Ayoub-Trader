import "server-only";

import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const scrypt = promisify(scryptCallback);
const sessionCookie = "ayoub-vip-client";
const sessionDuration = 60 * 60 * 24 * 30;

function clientSecret() {
  const secret = process.env.VIP_CLIENT_SECRET ?? process.env.TRANSFER_DASHBOARD_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set VIP_CLIENT_SECRET to a random secret of at least 32 characters.");
  }
  return secret;
}

function signSession(customerId: string, expiresAt: string) {
  return createHmac("sha256", clientSecret()).update(`${customerId}.${expiresAt}`).digest("hex");
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

export async function hashVipPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyVipPassword(password: string, storedHash: string) {
  const [algorithm, salt, encodedHash, extra] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !encodedHash || extra) return false;
  const expected = Buffer.from(encodedHash, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return expected.length > 0 && safeEqual(actual.toString("hex"), expected.toString("hex"));
}

export function newVipVerificationToken() {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  };
}

export async function verifyVipEmailToken(token: string) {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return false;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await prisma.tradingCustomerAccount.updateMany({
    where: { verificationTokenHash: tokenHash, verificationExpiresAt: { gt: new Date() } },
    data: { emailVerifiedAt: new Date(), verificationTokenHash: null, verificationExpiresAt: null },
  });
  return result.count === 1;
}

export async function getVipClient() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  const [customerId, expiresAt, signature, extra] = token.split(".");
  if (!customerId || !expiresAt || !signature || extra || !/^\d+$/.test(expiresAt)) return null;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return null;
  if (!safeEqual(signature, signSession(customerId, expiresAt))) return null;

  const account = await prisma.tradingCustomerAccount.findUnique({
    where: { customerId },
    select: {
      email: true,
      emailVerifiedAt: true,
      customer: { select: { id: true, clientId: true, name: true, phone: true, createdAt: true } },
    },
  });
  if (!account?.emailVerifiedAt || !account.customer) return null;
  return { ...account.customer, email: account.email };
}

export async function setVipClientSession(customerId: string) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + sessionDuration);
  (await cookies()).set(sessionCookie, `${customerId}.${expiresAt}.${signSession(customerId, expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDuration,
  });
}

export async function clearVipClientSession() {
  (await cookies()).set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}