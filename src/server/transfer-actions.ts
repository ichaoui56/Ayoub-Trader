"use server";

import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  UserRole,
} from "@prisma/client";
import { prisma } from "./prisma";
import {
  getDashboardSessionSignature,
  getDashboardUser,
} from "./dashboard-auth";
import {
  defaultPrivateServices,
  defaultRoutes,
  defaultTransferLocations,
} from "../transfers/defaults";
import type {
  PrivateServiceInput,
  RouteInput,
  TransferDashboardData,
  TransferLocationData,
  TransferDashboardUser,
  TransferRequestInput,
  TransferRouteData,
} from "../transfers/types";

const sessionCookie = "morocco-transfer-admin";
const sessionDuration = 8 * 60 * 60;

function derivePasswordHash(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await derivePasswordHash(password, salt);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, encodedHash, extra] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !encodedHash || extra) return false;
  const expected = Buffer.from(encodedHash, "hex");
  const actual = await derivePasswordHash(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function ensureInitialAdminAccount() {
  if (await prisma.user.count()) return;

  const configuredUsername = process.env.TRANSFER_ADMIN_USERNAME ?? "admin";
  const configuredPassword =
    process.env.TRANSFER_ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "production" ? undefined : "password");
  if (!configuredPassword) {
    throw new Error(
      "Set TRANSFER_ADMIN_USERNAME and a strong TRANSFER_ADMIN_PASSWORD before initializing dashboard users in production.",
    );
  }
  if (process.env.NODE_ENV === "production" && configuredPassword.length < 8) {
    throw new Error("TRANSFER_ADMIN_PASSWORD must be at least 8 characters in production.");
  }
  const username = cleanText(configuredUsername, "Admin username", 100).toLowerCase();

  await prisma.user.upsert({
    where: { username },
    update: {},
    create: {
      username,
      passwordHash: await hashPassword(configuredPassword),
      role: UserRole.ADMIN,
    },
  });
}

async function getDashboardSessionUser(): Promise<TransferDashboardUser | null> {
  const user = await getDashboardUser();
  return user ? { username: user.username, role: user.role } : null;
}

async function requireDashboardAccess() {
  const user = await getDashboardUser();
  if (!user) {
    throw new Error("You need to sign in to manage transfers.");
  }
  return user;
}

async function requireAdminAccess() {
  const user = await requireDashboardAccess();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("Only an administrator can manage the transfer catalogue.");
  }
}

function cleanText(value: unknown, label: string, maxLength: number, required = true) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null)) return "";
    throw new Error(`${label} is invalid.`);
  }
  const cleaned = value.trim();
  if (required && !cleaned) throw new Error(`${label} is required.`);
  if (cleaned.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return cleaned;
}

export async function signInTransferDashboard(usernameInput: string, password: string) {
  if (!process.env.DATABASE_URL) {
    return { ok: false as const, message: "Dashboard sign-in requires a configured PostgreSQL database." };
  }
  if (
    typeof usernameInput !== "string" ||
    usernameInput.length > 100 ||
    typeof password !== "string" ||
    password.length > 512
  ) {
    return { ok: false as const, message: "Enter a valid username and password." };
  }
  await ensureInitialAdminAccount();
  const username = usernameInput.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false as const, message: "Those credentials didn’t match. Please try again." };
  }

  const expiresAt = String(Math.floor(Date.now() / 1000) + sessionDuration);
  const signature = getDashboardSessionSignature(user.id, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/dashboard",
    maxAge: 0,
  });
  cookieStore.set(sessionCookie, `${user.id}.${expiresAt}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionDuration,
  });
  revalidatePath("/dashboard/transfers");
  return { ok: true as const };
}

export async function updateMyDashboardAccount(
  usernameInput: string,
  currentPassword: string,
  newPassword: string,
  passwordConfirmation: string,
) {
  const sessionUser = await requireDashboardAccess();
  if (!process.env.DATABASE_URL) throw new Error("Account settings require a configured PostgreSQL database.");
  if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 512) {
    throw new Error("Enter your current password to confirm these changes.");
  }
  if (typeof newPassword !== "string" || newPassword.length > 512 || typeof passwordConfirmation !== "string" || passwordConfirmation.length > 512) {
    throw new Error("The new password is invalid.");
  }

  const username = cleanText(usernameInput, "Username", 100).toLowerCase();
  if (username.length < 3 || !/^[a-z0-9._-]+$/.test(username)) {
    throw new Error("Username must be at least 3 characters and use letters, numbers, dots, underscores, or hyphens.");
  }
  if (newPassword && newPassword.length < 8) {
    throw new Error("New passwords must be at least 8 characters.");
  }
  if (newPassword !== passwordConfirmation) {
    throw new Error("The new password and confirmation do not match.");
  }
  if (!newPassword && passwordConfirmation) {
    throw new Error("Enter a new password before confirming it.");
  }
  if (username === sessionUser.username && !newPassword) {
    throw new Error("There are no account changes to save.");
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user || !user.isActive || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new Error("Your current password did not match.");
  }

  const existingUser = await prisma.user.findFirst({
    where: { username, id: { not: user.id } },
    select: { id: true },
  });
  if (existingUser) throw new Error("That username is already in use.");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      ...(newPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true as const, username };
}

export async function verifyMyCurrentDashboardPassword(password: string) {
  const sessionUser = await requireDashboardAccess();
  if (typeof password !== "string" || !password || password.length > 512) {
    return { valid: false as const };
  }
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { isActive: true, passwordHash: true },
  });
  if (!user?.isActive) return { valid: false as const };
  return { valid: await verifyPassword(password, user.passwordHash) };
}

export async function signOutTransferDashboard() {
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 0,
  };
  cookieStore.set(sessionCookie, "", { ...cookieOptions, path: "/" });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/dashboard/loginP");
  redirect("/dashboard/loginP");
}

export async function getTransferDashboardIdentity() {
  return getDashboardSessionUser();
}

export async function getTransferDashboardData(): Promise<
  { authorized: false } | { authorized: true; user: TransferDashboardUser; data: TransferDashboardData }
> {
  const user = await getDashboardSessionUser();
  if (!user) return { authorized: false };
  return {
    authorized: true,
    user,
    data: { routes: [], services: [], locations: [], requests: [] },
  };
}

export async function getPublicTransferCatalog() {
  return {
    bookingEnabled: false,
    routes: defaultRoutes.map((route, sortOrder) => ({ ...route, fromFr: route.from, toFr: route.to, id: `catalog-route-${sortOrder}`, notes: "", notesFr: "", currency: "EUR", isActive: true, sortOrder })) as TransferRouteData[],
    services: defaultPrivateServices.map((service, sortOrder) => ({ ...service, nameFr: service.name, descriptionFr: service.description, durationFr: service.duration, imageAltFr: service.imageAlt ?? "", id: `catalog-service-${sortOrder}`, currency: "EUR", image: service.image ?? "", imageAlt: service.imageAlt ?? "", isActive: true, sortOrder })),
    locations: defaultTransferLocations.map((name, sortOrder) => ({ id: `catalog-location-${sortOrder}`, name, nameFr: name, isActive: true, isDeparture: true, isArrival: true, sortOrder })) as TransferLocationData[],
    reservedPrivateSlots: [],
  };
}

export async function saveTransferRoute(input: RouteInput) {
  await requireAdminAccess();
  void input;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function deleteTransferRoute(id: string) {
  await requireAdminAccess();
  void id;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function savePrivateTransferService(input: PrivateServiceInput) {
  await requireAdminAccess();
  void input;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function deletePrivateTransferService(id: string) {
  await requireAdminAccess();
  void id;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function saveTransferLocation(input: {
  id?: string;
  name: string;
  nameFr: string;
  isActive: boolean;
  isDeparture: boolean;
  isArrival: boolean;
}) {
  await requireAdminAccess();
  void input;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function deleteTransferLocation(id: string) {
  await requireAdminAccess();
  void id;
  throw new Error("Transfer catalogue editing is disabled because its database tables were removed.");
}

export async function updateTransferRequestStatus(id: string, status: string) {
  await requireDashboardAccess();
  void id;
  void status;
  throw new Error("Transfer requests are unavailable because their database table was removed.");
}

export async function createTransferRequest(input: TransferRequestInput) {
  void input;
  throw new Error("Transfer booking is unavailable because its database tables were removed. Please contact support.");
}
