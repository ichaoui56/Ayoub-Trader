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
  PrivateServiceKind,
  TransferRequestStatus,
  TransferServiceType,
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
  PrivateServiceData,
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
const seedKey = "transfer-catalog-v1";

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

function cleanPrice(value: unknown, label = "Price") {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    throw new Error(`${label} must be a valid amount between 0 and 100000.`);
  }
  return price;
}

function cleanInteger(value: unknown, label: string, min: number, max: number) {
  const integer = Number(value);
  if (!Number.isInteger(integer) || integer < min || integer > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return integer;
}

function normalizeStartTimes(value: unknown) {
  if (!Array.isArray(value) || value.length > 24) {
    throw new Error("Add up to 24 valid activity start times.");
  }
  const times = value.map((time) => cleanText(time, "Start time", 5));
  if (times.some((time) => !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    throw new Error("Activity start times must use a valid 24-hour time.");
  }
  return [...new Set(times)].sort();
}

function assertBoolean(value: unknown, label: string): value is boolean {
  if (typeof value !== "boolean") throw new Error(`${label} must be enabled or disabled.`);
  return value;
}

async function ensureTransferCatalog() {
  const seeded = await prisma.transferSetting.findUnique({ where: { key: seedKey } });
  if (seeded) return;

  await prisma.$transaction(async (transaction) => {
    await transaction.transferRoute.createMany({
      data: defaultRoutes.map((route, sortOrder) => ({ ...route, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.privateTransferService.createMany({
      data: defaultPrivateServices.map((service, sortOrder) => ({ ...service, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.transferLocation.createMany({
      data: defaultTransferLocations.map((name, sortOrder) => ({ name, sortOrder })),
      skipDuplicates: true,
    });
    await transaction.transferSetting.upsert({
      where: { key: seedKey },
      create: { key: seedKey, value: "seeded" },
      update: { value: "seeded" },
    });
  });
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

  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL to your PostgreSQL connection string before opening the dashboard.");
  }
  await ensureTransferCatalog();
  const [routes, services, locations, requests] = await Promise.all([
    user.role === UserRole.ADMIN
      ? prisma.transferRoute.findMany({ orderBy: [{ sortOrder: "asc" }, { from: "asc" }] })
      : Promise.resolve([]),
    user.role === UserRole.ADMIN
      ? prisma.privateTransferService.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
      : Promise.resolve([]),
    user.role === UserRole.ADMIN
      ? prisma.transferLocation.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
      : Promise.resolve([]),
    prisma.transferRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
  ]);

  return {
    authorized: true,
    user,
    data: {
      routes: routes.map((route) => ({
        id: route.id,
        from: route.from,
        to: route.to,
        price: route.price,
        notes: route.notes,
        currency: route.currency,
        isActive: route.isActive,
        sortOrder: route.sortOrder,
      })),
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        kind: service.kind,
        description: service.description,
        price: service.price,
        currency: service.currency,
        passengerLimit: service.passengerLimit,
        duration: service.duration,
        startTimes: service.startTimes,
        image: service.image,
        imageAlt: service.imageAlt,
        isActive: service.isActive,
        sortOrder: service.sortOrder,
      })),
      locations: locations.map((location) => ({
        id: location.id,
        name: location.name,
        isActive: location.isActive,
        isDeparture: location.isDeparture,
        isArrival: location.isArrival,
        sortOrder: location.sortOrder,
      })),
      requests: requests.map((request) => ({
        id: request.id,
        serviceType: request.serviceType,
        status: request.status,
        serviceName: request.serviceName,
        departure: request.departure,
        arrival: request.arrival,
        priceAtRequest: request.priceAtRequest,
        currency: request.currency,
        serviceDate: request.serviceDate.toISOString(),
        serviceTime: request.serviceTime,
        passengerCount: request.passengerCount,
        luggageCount: request.luggageCount,
        hotelAddress: request.hotelAddress,
        flightNumber: request.flightNumber,
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        notes: request.notes,
        createdAt: request.createdAt.toISOString(),
      })),
    },
  };
}

export async function getPublicTransferCatalog() {
  if (!process.env.DATABASE_URL) {
    return {
      bookingEnabled: false,
      routes: defaultRoutes.map((route, sortOrder) => ({
        ...route,
        id: `catalog-route-${sortOrder}`,
        notes: "",
        currency: "EUR",
        isActive: true,
        sortOrder,
      })),
      services: defaultPrivateServices.map((service, sortOrder) => ({
        ...service,
        id: `catalog-service-${sortOrder}`,
        currency: "EUR",
        image: service.image ?? "",
        imageAlt: service.imageAlt ?? "",
        isActive: true,
        sortOrder,
      })),
      reservedPrivateSlots: [],
      locations: defaultTransferLocations.map((name, sortOrder) => ({
        id: `catalog-location-${sortOrder}`,
        name,
        isActive: true,
        isDeparture: true,
        isArrival: true,
        sortOrder,
      })),
    };
  }

  await ensureTransferCatalog();
  const [routes, services, locations, confirmedPrivateRequests] = await Promise.all([
    prisma.transferRoute.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { from: "asc" }] }),
    prisma.privateTransferService.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.transferLocation.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.transferRequest.findMany({
      where: {
        serviceType: TransferServiceType.PRIVATE_SERVICE,
        status: TransferRequestStatus.CONFIRMED,
        privateServiceId: { not: null },
        serviceTime: { not: null },
      },
      select: { privateServiceId: true, serviceDate: true, serviceTime: true },
    }),
  ]);
  return {
    bookingEnabled: true,
    routes: routes as TransferRouteData[],
    services: services.map((service) => ({
      ...service,
      startTimes: service.startTimes,
    })),
    locations: locations as TransferLocationData[],
    reservedPrivateSlots: confirmedPrivateRequests.flatMap((request) =>
      request.privateServiceId && request.serviceTime
        ? [{
          privateServiceId: request.privateServiceId,
          serviceDate: request.serviceDate.toISOString().slice(0, 10),
          serviceTime: request.serviceTime,
        }]
        : [],
    ),
  };
}

export async function saveTransferRoute(input: RouteInput) {
  await requireAdminAccess();
  const from = cleanText(input.from, "Departure", 120);
  const to = cleanText(input.to, "Arrival", 120);
  if (from === to) throw new Error("Departure and arrival must be different.");
  const data = {
    from,
    to,
    price: cleanPrice(input.price),
    notes: cleanText(input.notes, "Trip notes", 500, false),
    isActive: assertBoolean(input.isActive, "Status"),
  };
  const route = input.id
    ? await prisma.transferRoute.update({ where: { id: cleanText(input.id, "Route", 64) }, data })
    : await prisma.transferRoute.create({ data });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
  return route as TransferRouteData;
}

export async function deleteTransferRoute(id: string) {
  await requireAdminAccess();
  await prisma.transferRoute.delete({ where: { id: cleanText(id, "Route", 64) } });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
}

export async function savePrivateTransferService(input: PrivateServiceInput) {
  await requireAdminAccess();
  const kindValues = Object.values(PrivateServiceKind) as string[];
  if (!kindValues.includes(input.kind)) throw new Error("Choose a valid private service type.");
  const data = {
    name: cleanText(input.name, "Name", 120),
    kind: input.kind,
    description: cleanText(input.description, "Description", 500, false),
    price: cleanPrice(input.price),
    passengerLimit: cleanInteger(input.passengerLimit, "Passenger limit", 1, 100),
    duration: cleanText(input.duration, "Duration", 80),
    startTimes: normalizeStartTimes(input.startTimes),
    image: cleanText(input.image, "Image", 1000, false),
    imageAlt: cleanText(input.imageAlt, "Image description", 240, false),
    isActive: assertBoolean(input.isActive, "Status"),
  };
  if (data.image && /^https?:\/\//i.test(data.image)) {
    const imageUrl = new URL(data.image);
    if (imageUrl.protocol !== "https:") {
      throw new Error("Image URL must use HTTPS.");
    }
  } else if (data.image && !/^[A-Za-z0-9_-]{1,180}$/.test(data.image)) {
    throw new Error("Image must be a Pinata URL or a valid legacy image identifier.");
  }
  const service = input.id
    ? await prisma.privateTransferService.update({ where: { id: cleanText(input.id, "Service", 64) }, data })
    : await prisma.privateTransferService.create({ data });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
  return service as PrivateServiceData;
}

export async function deletePrivateTransferService(id: string) {
  await requireAdminAccess();
  await prisma.privateTransferService.delete({ where: { id: cleanText(id, "Service", 64) } });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
}

export async function saveTransferLocation(input: {
  id?: string;
  name: string;
  isActive: boolean;
  isDeparture: boolean;
  isArrival: boolean;
}) {
  await requireAdminAccess();
  const isDeparture = assertBoolean(input.isDeparture, "Departure availability");
  const isArrival = assertBoolean(input.isArrival, "Arrival availability");
  if (!isDeparture && !isArrival) {
    throw new Error("Choose whether this location can be used as a departure, arrival, or both.");
  }
  const data = {
    name: cleanText(input.name, "Location", 120),
    isActive: assertBoolean(input.isActive, "Status"),
    isDeparture,
    isArrival,
  };
  const location = input.id
    ? await prisma.transferLocation.update({ where: { id: cleanText(input.id, "Location", 64) }, data })
    : await prisma.transferLocation.create({ data });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
  return location as TransferLocationData;
}

export async function deleteTransferLocation(id: string) {
  await requireAdminAccess();
  await prisma.transferLocation.delete({ where: { id: cleanText(id, "Location", 64) } });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
}

export async function updateTransferRequestStatus(id: string, status: string) {
  await requireDashboardAccess();
  if (!Object.values(TransferRequestStatus).includes(status as TransferRequestStatus)) {
    throw new Error("Choose a valid request status.");
  }
  const requestId = cleanText(id, "Request", 64);
  await prisma.$transaction(async (transaction) => {
    const request = await transaction.transferRequest.findUnique({
      where: { id: requestId },
      select: {
        serviceType: true,
        privateServiceId: true,
        serviceDate: true,
        serviceTime: true,
      },
    });
    if (
      status === TransferRequestStatus.CONFIRMED &&
      request?.serviceType === TransferServiceType.PRIVATE_SERVICE &&
      request.privateServiceId &&
      request.serviceTime
    ) {
      const slotKey = `${request.privateServiceId}:${request.serviceDate.toISOString()}:${request.serviceTime}`;
      await transaction.$queryRaw<{ lock_result: string }[]>`
        SELECT pg_advisory_xact_lock(hashtext(${slotKey}))::text AS lock_result
      `;
      const alreadyReserved = await transaction.transferRequest.findFirst({
        where: {
          id: { not: requestId },
          serviceType: TransferServiceType.PRIVATE_SERVICE,
          status: TransferRequestStatus.CONFIRMED,
          privateServiceId: request.privateServiceId,
          serviceDate: request.serviceDate,
          serviceTime: request.serviceTime,
        },
        select: { id: true },
      });
      if (alreadyReserved) {
        throw new Error("This activity time is already reserved by another confirmed booking.");
      }
    }
    await transaction.transferRequest.update({
      where: { id: requestId },
      data: { status: status as TransferRequestStatus },
    });
  });
  revalidatePath("/dashboard/transfers");
  revalidatePath("/", "page");
}

export async function createTransferRequest(input: TransferRequestInput) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Online booking is not set up yet. Please contact our team directly.");
  }
  if (!Object.values(TransferServiceType).includes(input.serviceType)) {
    throw new Error("Choose a valid transfer type.");
  }
  const serviceDate = new Date(`${cleanText(input.serviceDate, "Date", 10)}T00:00:00.000Z`);
  if (Number.isNaN(serviceDate.getTime()) || serviceDate.toISOString().slice(0, 10) !== input.serviceDate) {
    throw new Error("Choose a valid travel date.");
  }
  const passengerCount = cleanInteger(input.passengerCount, "Passengers", 1, 100);
  const luggageCount = cleanInteger(input.luggageCount, "Luggage", 0, 100);
  const serviceTime = cleanText(input.serviceTime, "Time", 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(serviceTime)) {
    throw new Error("Choose a valid travel time.");
  }
  const hotelAddress = cleanText(input.hotelAddress, "Hotel or address", 240, false);
  const flightNumber = cleanText(input.flightNumber, "Flight number", 32, false);
  const customerName = cleanText(input.customerName, "Name", 120);
  const customerPhone = cleanText(input.customerPhone, "Phone", 48);
  const customerEmail = cleanText(input.customerEmail, "Email", 254);
  const notes = cleanText(input.notes, "Notes", 1200, false);
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Enter a valid email address.");
  }
  let departure = cleanText(input.departure, "Departure", 120, false);
  let arrival = cleanText(input.arrival, "Arrival", 120, false);
  let serviceName = "";
  let routeId: string | undefined;
  let privateServiceId: string | undefined;
  let priceAtRequest: number | undefined;

  if (input.serviceType === "AIRPORT_ROUTE") {
    routeId = cleanText(input.routeId, "Route", 64);
    const route = await prisma.transferRoute.findFirst({ where: { id: routeId, isActive: true } });
    if (!route) throw new Error("That route is no longer available. Please choose another route.");
    departure = route.from;
    arrival = route.to;
    serviceName = `${route.from} → ${route.to}`;
    priceAtRequest = route.price;
  } else if (input.serviceType === "PRIVATE_SERVICE") {
    privateServiceId = cleanText(input.privateServiceId, "Private service", 64);
    const service = await prisma.privateTransferService.findFirst({
      where: { id: privateServiceId, isActive: true },
    });
    if (!service) throw new Error("That private service is no longer available. Please choose another.");
    if (passengerCount > service.passengerLimit) {
      throw new Error(`This service can carry up to ${service.passengerLimit} passengers.`);
    }
    if (service.startTimes.length > 0 && !service.startTimes.includes(serviceTime)) {
      throw new Error("Choose one of the available start times for this activity.");
    }
    const alreadyReserved = await prisma.transferRequest.findFirst({
      where: {
        serviceType: TransferServiceType.PRIVATE_SERVICE,
        status: TransferRequestStatus.CONFIRMED,
        privateServiceId,
        serviceDate,
        serviceTime,
      },
      select: { id: true },
    });
    if (alreadyReserved) {
      throw new Error("That activity time has just been reserved. Please choose another time.");
    }
    serviceName = service.name;
    priceAtRequest = service.price;
  } else {
    if (departure === arrival) throw new Error("Departure and arrival must be different.");
    const locations = await prisma.transferLocation.findMany({
      where: { isActive: true, name: { in: [departure, arrival] } },
      select: { name: true, isDeparture: true, isArrival: true },
    });
    const departureAvailable = locations.some((location) => location.name === departure && location.isDeparture);
    const arrivalAvailable = locations.some((location) => location.name === arrival && location.isArrival);
    if (!departureAvailable || !arrivalAvailable) {
      throw new Error("Choose an available departure and arrival location.");
    }
    if (
      (departure.startsWith("Autre") || arrival.startsWith("Autre")) &&
      !notes
    ) {
      throw new Error("Add the exact location in the notes.");
    }
    serviceName = "Transfert sur mesure";
  }

  if (passengerCount > 8 && input.serviceType !== "PRIVATE_SERVICE") {
    throw new Error("This transfer can carry up to 8 passengers.");
  }
  const created = await prisma.transferRequest.create({
    data: {
      serviceType: input.serviceType,
      serviceName,
      routeId,
      privateServiceId,
      departure,
      arrival,
      priceAtRequest,
      serviceDate,
      serviceTime: serviceTime || null,
      passengerCount,
      luggageCount,
      hotelAddress: hotelAddress || null,
      flightNumber: flightNumber || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/transfers");
  return { ok: true as const, requestId: created.id };
}
