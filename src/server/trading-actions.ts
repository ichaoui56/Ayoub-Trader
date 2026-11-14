"use server";

import {
  CoachingBookingStatus,
  CoachingPackage,
  CoachingSessionStatus,
  CoachingSlotKind,
  CopyTradingStatus,
  ManualPaymentService,
  ManualPaymentStatus,
  Prisma,
  PrivateRoomRequestStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  buildCoachingSchedule,
  COACHING_PLANS,
  isValidDateString,
  timeToMinute,
  type CoachingPlanCode,
  type TradingActionState,
} from "../trading";
import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";

class FormError extends Error {}

function value(formData: FormData, key: string, label: string, maxLength: number, required = true) {
  const raw = formData.get(key);
  if (typeof raw !== "string") {
    if (!required && raw === null) return "";
    throw new FormError(`${label} is invalid.`);
  }
  const cleaned = raw.trim();
  if (required && !cleaned) throw new FormError(`${label} is required.`);
  if (cleaned.length > maxLength) throw new FormError(`${label} must be ${maxLength} characters or fewer.`);
  return cleaned;
}

function contactDetails(formData: FormData) {
  const name = value(formData, "customerName", "Your name", 120);
  const enteredPhone = value(formData, "customerPhone", "WhatsApp number", 40).replace(/[\s().-]/g, "");
  const phone = enteredPhone.startsWith("00") ? `+${enteredPhone.slice(2)}` : enteredPhone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new FormError("Enter a WhatsApp number with country code, such as +212… .");
  const email = value(formData, "customerEmail", "Email address", 254, false);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FormError("Enter a valid email address.");
  return { name, phone, email: email || null };
}

async function findOrCreateCustomer(
  transaction: Prisma.TransactionClient,
  customer: ReturnType<typeof contactDetails>,
) {
  return transaction.tradingCustomer.upsert({
    where: { phone: customer.phone },
    create: { name: customer.name, phone: customer.phone, email: customer.email },
    update: { name: customer.name, email: customer.email },
    select: { id: true },
  });
}

function whatsappUrl(reference: string, service: string) {
  const number = (process.env.AYOUB_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (!number) return undefined;
  const message = `Hello Ayoub, I submitted a ${service} request. Reference: ${reference}. Please confirm you received it.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function formFailure(error: unknown, fallback: string): TradingActionState {
  if (error instanceof FormError) return { success: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, message: "That recurring time has just been reserved. Choose another start time and try again." };
  }
  console.error("[trading] Request could not be saved:", error);
  return { success: false, message: fallback };
}

function isImageProof(bytes: Uint8Array, mime: string) {
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const jpeg = bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
  return (mime === "image/png" && png) || (mime === "image/jpeg" && jpeg) || (mime === "image/webp" && webp);
}

async function depositProof(formData: FormData) {
  const file = formData.get("depositProof");
  if (!(file instanceof File) || file.size < 1 || file.size > 5_000_000) {
    throw new FormError("Upload a JPG, PNG, or WebP screenshot up to 5 MB.");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isImageProof(bytes, file.type)) throw new FormError("The deposit screenshot must be a valid JPG, PNG, or WebP image.");
  return {
    bytes: Buffer.from(bytes),
    mime: file.type,
    name: file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "deposit-proof",
  };
}

export async function submitPrivateRoomRequest(_state: TradingActionState, formData: FormData): Promise<TradingActionState> {
  if (value(formData, "website", "", 200, false)) return { success: true, message: "Your request has been received." };
  if (!process.env.DATABASE_URL) return { success: false, message: "Applications are temporarily unavailable. Please contact Ayoub directly." };

  try {
    const customer = contactDetails(formData);
    if (value(formData, "registered", "Referral registration confirmation", 10) !== "on") {
      throw new FormError("Confirm that you registered using Ayoub’s broker referral link.");
    }
    const proof = await depositProof(formData);
    const request = await prisma.$transaction(async (transaction) => {
      const savedCustomer = await findOrCreateCustomer(transaction, customer);
      const created = await transaction.privateRoomRequest.create({
        data: {
          customerId: savedCustomer.id,
          depositProof: proof.bytes,
          depositProofMime: proof.mime,
          depositProofName: proof.name,
        },
        select: { id: true },
      });
      await transaction.manualPayment.create({
        data: {
          customerId: savedCustomer.id,
          privateRoomRequestId: created.id,
          service: ManualPaymentService.PRIVATE_ROOM,
          amount: 80,
          currency: "USD",
          note: "Private rooms access fee; pending manual verification.",
        },
      });
      return created;
    });
    revalidatePath("/dashboard");
    return {
      success: true,
      reference: request.id,
      message: "Request received. Ayoub will review your broker deposit and verify the $80 fee before granting VIP access.",
      whatsappUrl: whatsappUrl(request.id, "private rooms"),
    };
  } catch (error) {
    return formFailure(error, "We could not save your request. Please try again or contact Ayoub.");
  }
}

export async function submitCopyTradingApplication(_state: TradingActionState, formData: FormData): Promise<TradingActionState> {
  if (value(formData, "website", "", 200, false)) return { success: true, message: "Your request has been received." };
  if (!process.env.DATABASE_URL) return { success: false, message: "Applications are temporarily unavailable. Please contact Ayoub directly." };

  try {
    const customer = contactDetails(formData);
    const brokerName = value(formData, "brokerName", "Broker", 120);
    const rawBalance = value(formData, "accountBalance", "Account balance", 20);
    const accountBalance = Number(rawBalance);
    if (!Number.isFinite(accountBalance) || accountBalance < 200 || accountBalance > 100_000_000) {
      throw new FormError("Copy trading requires an account balance of at least $200.");
    }
    const application = await prisma.$transaction(async (transaction) => {
      const savedCustomer = await findOrCreateCustomer(transaction, customer);
      return transaction.copyTradingApplication.create({
        data: { customerId: savedCustomer.id, brokerName, accountBalance },
        select: { id: true },
      });
    });
    revalidatePath("/dashboard");
    return {
      success: true,
      reference: application.id,
      message: "Application received for manual review. No trading credentials were collected or sent.",
      whatsappUrl: whatsappUrl(application.id, "copy trading"),
    };
  } catch (error) {
    return formFailure(error, "We could not save your application. Please try again or contact Ayoub.");
  }
}

function moroccoDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, minute: Number(part("hour")) * 60 + Number(part("minute")) };
}

export async function submitCoachingBooking(_state: TradingActionState, formData: FormData): Promise<TradingActionState> {
  if (value(formData, "website", "", 200, false)) return { success: true, message: "Your request has been received." };
  if (!process.env.DATABASE_URL) return { success: false, message: "Coaching reservations are temporarily unavailable. Please contact Ayoub directly." };

  try {
    const customer = contactDetails(formData);
    const packageCode = value(formData, "package", "Coaching plan", 20) as CoachingPlanCode;
    if (!(packageCode in COACHING_PLANS)) throw new FormError("Choose a valid coaching plan.");
    const plan = COACHING_PLANS[packageCode];
    const startDate = value(formData, "startDate", "Starting date", 10);
    const schedule = buildCoachingSchedule(startDate, packageCode);
    if (startDate < moroccoDateTime().date) throw new FormError("Choose today or a future starting date.");
    const startTime = value(formData, "startTime", "Daily start time", 5);
    const startMinute = timeToMinute(startTime);
    if (startMinute + plan.durationMinutes > 1440) throw new FormError("That session would continue into the next day. Choose an earlier time.");
    const today = moroccoDateTime();
    if (startDate === today.date && startMinute <= today.minute) throw new FormError("Choose a future start time in Morocco time.");

    const booking = await prisma.$transaction(async (transaction) => {
      const savedCustomer = await findOrCreateCustomer(transaction, customer);
      return transaction.coachingBooking.create({
        data: {
          customerId: savedCustomer.id,
          package: packageCode as CoachingPackage,
          priceDh: plan.priceDh,
          startDate: new Date(`${schedule.startDate}T00:00:00.000Z`),
          endDate: new Date(`${schedule.endDate}T00:00:00.000Z`),
          dailyStartMinute: startMinute,
          durationMinutes: plan.durationMinutes,
          expectedSessions: schedule.dates.length,
          remainingSessions: schedule.dates.length,
          sessions: {
            create: schedule.dates.map((date) => {
              const sessionDate = new Date(`${date}T00:00:00.000Z`);
              return {
                date: sessionDate,
                startMinute,
                durationMinutes: plan.durationMinutes,
                timeSlots: {
                  create: Array.from({ length: plan.durationMinutes / 15 }, (_, index) => ({
                    date: sessionDate,
                    quarter: startMinute / 15 + index,
                    kind: CoachingSlotKind.RESERVED,
                  })),
                },
              };
            }),
          },
          payments: {
            create: {
              customer: { connect: { id: savedCustomer.id } },
              service: ManualPaymentService.COACHING,
              amount: plan.priceDh,
              currency: "MAD",
              note: "Coaching subscription; payment handled outside the website.",
            },
          },
        },
        select: { id: true },
      });
    });
    revalidatePath("/dashboard");
    return {
      success: true,
      reference: booking.id,
      message: `Recurring reservation requested for ${schedule.dates.length} sessions. The full monthly schedule is held while Ayoub reviews payment and confirms your subscription.`,
      whatsappUrl: whatsappUrl(booking.id, "coaching reservation"),
    };
  } catch (error) {
    return formFailure(error, "We could not reserve that monthly schedule. Try another time or contact Ayoub.");
  }
}

async function requireTradingAdmin() {
  const user = await getActiveAdmin();
  if (!user) throw new Error("Only an active administrator can manage trading services.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing trading services.");
  return user;
}

function requestId(formData: FormData) {
  const id = value(formData, "id", "Request", 40);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("The request reference is invalid.");
  return id;
}

function refreshTradingDashboard() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/trading");
}

export async function reviewPrivateRoomDeposit(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  const decision = value(formData, "decision", "Deposit review", 10);
  if (decision !== "verify" && decision !== "reject") throw new Error("The deposit review is invalid.");
  const request = await prisma.privateRoomRequest.findUnique({ where: { id }, select: { status: true, depositProof: true } });
  if (!request?.depositProof || request.status !== PrivateRoomRequestStatus.SUBMITTED) {
    throw new Error("This request is not awaiting deposit review.");
  }
  await prisma.privateRoomRequest.update({
    where: { id },
    data: decision === "verify"
      ? { status: PrivateRoomRequestStatus.DEPOSIT_VERIFIED, depositVerifiedAt: new Date() }
      : { status: PrivateRoomRequestStatus.REJECTED, depositVerifiedAt: null },
  });
  refreshTradingDashboard();
}

function addCalendarMonths(date: Date, count: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + count);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export async function grantPrivateRoomVip(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  const request = await prisma.privateRoomRequest.findUnique({
    where: { id },
    include: { payments: { where: { status: ManualPaymentStatus.VERIFIED }, take: 1 } },
  });
  if (!request || request.status !== PrivateRoomRequestStatus.DEPOSIT_VERIFIED || !request.depositVerifiedAt) {
    throw new Error("Verify the broker deposit before granting VIP access.");
  }
  if (!request.payments.length) throw new Error("Verify the $80 fee payment before granting VIP access.");
  const now = new Date();
  await prisma.privateRoomRequest.update({
    where: { id },
    data: { status: PrivateRoomRequestStatus.VIP_ACTIVE, vipGrantedAt: now, vipExpiresAt: addCalendarMonths(now, 2) },
  });
  refreshTradingDashboard();
}

export async function reviewManualPayment(formData: FormData) {
  const admin = await requireTradingAdmin();
  const id = requestId(formData);
  const decision = value(formData, "decision", "Payment review", 10);
  if (decision !== "verify" && decision !== "reject") throw new Error("The payment review is invalid.");
  await prisma.manualPayment.update({
    where: { id },
    data: {
      status: decision === "verify" ? ManualPaymentStatus.VERIFIED : ManualPaymentStatus.REJECTED,
      verifiedAt: decision === "verify" ? new Date() : null,
      verifiedById: decision === "verify" ? admin.id : null,
    },
  });
  refreshTradingDashboard();
}

export async function updateCopyTradingStatus(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  const nextStatus = value(formData, "status", "Application status", 40) as CopyTradingStatus;
  const application = await prisma.copyTradingApplication.findUnique({ where: { id } });
  if (!application) throw new Error("This copy trading application no longer exists.");
  if (nextStatus === CopyTradingStatus.AUTHORIZED || nextStatus === CopyTradingStatus.ACTIVE) {
    try {
      if (new URL(process.env.AYOUB_BROKER_AUTHORIZATION_URL ?? "").protocol !== "https:") {
        throw new Error();
      }
    } catch {
      throw new Error("Configure the broker-supported HTTPS authorization URL before authorizing or activating copy trading.");
    }
  }

  const allowed =
    (nextStatus === CopyTradingStatus.UNDER_REVIEW && application.status === CopyTradingStatus.NEW) ||
    (nextStatus === CopyTradingStatus.AUTHORIZATION_PENDING && application.status === CopyTradingStatus.UNDER_REVIEW) ||
    (nextStatus === CopyTradingStatus.AUTHORIZED && application.status === CopyTradingStatus.AUTHORIZATION_PENDING) ||
    (nextStatus === CopyTradingStatus.ACTIVE && application.status === CopyTradingStatus.AUTHORIZED) ||
    (nextStatus === CopyTradingStatus.PAUSED && application.status === CopyTradingStatus.ACTIVE) ||
    (nextStatus === CopyTradingStatus.REJECTED && application.status !== CopyTradingStatus.ACTIVE && application.status !== CopyTradingStatus.PAUSED);
  if (!allowed) throw new Error("That copy trading status transition is not allowed.");

  await prisma.copyTradingApplication.update({
    where: { id },
    data: {
      status: nextStatus,
      ...(nextStatus === CopyTradingStatus.UNDER_REVIEW ? { reviewedAt: new Date() } : {}),
      ...(nextStatus === CopyTradingStatus.AUTHORIZED ? { authorizedAt: new Date() } : {}),
      ...(nextStatus === CopyTradingStatus.ACTIVE ? { activatedAt: new Date() } : {}),
    },
  });
  refreshTradingDashboard();
}

export async function recordCopyTradingProfitShare(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  const application = await prisma.copyTradingApplication.findUnique({ where: { id } });
  if (!application || application.status !== CopyTradingStatus.ACTIVE) {
    throw new Error("Record a profit share only for an active copy-trading account.");
  }
  const grossProfit = Number(value(formData, "grossProfit", "Generated profit", 20));
  if (!Number.isFinite(grossProfit) || grossProfit <= 0 || grossProfit > 100_000_000) {
    throw new Error("Enter a positive generated-profit amount.");
  }
  const currency = value(formData, "currency", "Currency", 3);
  if (!("USD,EUR,MAD".split(",").includes(currency))) throw new Error("Choose USD, EUR, or MAD.");
  const share = Number((grossProfit * 0.5).toFixed(2));
  await prisma.manualPayment.create({
    data: {
      customerId: application.customerId,
      copyTradingApplicationId: application.id,
      service: ManualPaymentService.COPY_TRADING,
      amount: share,
      currency,
      note: `${currency} ${grossProfit.toFixed(2)} reported generated profit; 50% share due.`,
    },
  });
  refreshTradingDashboard();
}

export async function updateCoachingBookingStatus(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  const decision = value(formData, "decision", "Coaching review", 20);
  const booking = await prisma.coachingBooking.findUnique({
    where: { id },
    include: { payments: { where: { status: ManualPaymentStatus.VERIFIED }, take: 1 } },
  });
  if (!booking) throw new Error("This coaching reservation no longer exists.");

  if (decision === "activate") {
    if (!booking.payments.length) throw new Error("Verify the coaching payment before activating the subscription.");
    if (booking.status !== CoachingBookingStatus.PENDING && booking.status !== CoachingBookingStatus.CONFIRMED) {
      throw new Error("This coaching reservation cannot be activated from its current status.");
    }
    await prisma.coachingBooking.update({ where: { id }, data: { status: CoachingBookingStatus.ACTIVE, activatedAt: new Date() } });
  } else if (decision === "confirm") {
    if (booking.status !== CoachingBookingStatus.PENDING) throw new Error("Only a pending reservation can be confirmed.");
    await prisma.coachingBooking.update({ where: { id }, data: { status: CoachingBookingStatus.CONFIRMED } });
  } else if (decision === "reject" || decision === "cancel") {
    if (booking.status !== CoachingBookingStatus.PENDING && booking.status !== CoachingBookingStatus.CONFIRMED && booking.status !== CoachingBookingStatus.ACTIVE) {
      throw new Error("This coaching reservation cannot be cancelled from its current status.");
    }
    await prisma.$transaction(async (transaction) => {
      await transaction.coachingTimeSlot.deleteMany({ where: { session: { bookingId: id } } });
      await transaction.coachingSession.updateMany({
        where: { bookingId: id, status: CoachingSessionStatus.SCHEDULED },
        data: { status: CoachingSessionStatus.CANCELLED },
      });
      await transaction.coachingBooking.update({
        where: { id },
        data: { status: decision === "reject" ? CoachingBookingStatus.REJECTED : CoachingBookingStatus.CANCELLED },
      });
    });
  } else {
    throw new Error("The coaching review action is invalid.");
  }
  refreshTradingDashboard();
}

export async function completeCoachingSession(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  await prisma.$transaction(async (transaction) => {
    const session = await transaction.coachingSession.findUnique({ where: { id }, include: { booking: true } });
    if (!session || session.status !== CoachingSessionStatus.SCHEDULED) throw new Error("This session is not available to complete.");
    if (session.booking.status !== CoachingBookingStatus.ACTIVE) throw new Error("Activate the paid subscription before completing sessions.");
    if (session.date.toISOString().slice(0, 10) > moroccoDateTime().date) throw new Error("A future coaching session cannot be completed yet.");
    const remaining = Math.max(0, session.booking.remainingSessions - 1);
    await transaction.coachingSession.update({ where: { id }, data: { status: CoachingSessionStatus.COMPLETED } });
    await transaction.coachingTimeSlot.deleteMany({ where: { sessionId: id } });
    await transaction.coachingBooking.update({
      where: { id: session.bookingId },
      data: {
        remainingSessions: remaining,
        ...(remaining === 0 ? { status: CoachingBookingStatus.COMPLETED } : {}),
      },
    });
  });
  refreshTradingDashboard();
}

export async function blockCoachingAvailability(_state: TradingActionState, formData: FormData): Promise<TradingActionState> {
  try {
    await requireTradingAdmin();
    const date = value(formData, "date", "Date", 10);
    if (!isValidDateString(date) || date < moroccoDateTime().date) throw new FormError("Choose today or a future date to block.");
    const parseBlockedTime = (input: string) => {
      try {
        return timeToMinute(input);
      } catch (error) {
        throw new FormError(error instanceof Error ? error.message : "Choose a valid time.");
      }
    };
    const allDay = formData.get("allDay") === "on";
    const startMinute = allDay ? 0 : parseBlockedTime(value(formData, "startTime", "Start time", 5));
    const endMinute = allDay ? 1440 : parseBlockedTime(value(formData, "endTime", "End time", 5));
    if (endMinute <= startMinute) throw new FormError("The end time must be after the start time on the same day.");
    const reason = value(formData, "reason", "Reason", 160, false);
    const blockedDate = new Date(`${date}T00:00:00.000Z`);
    await prisma.coachingAvailabilityBlock.create({
      data: {
        date: blockedDate,
        startMinute,
        endMinute,
        reason,
        timeSlots: {
          create: Array.from({ length: (endMinute - startMinute) / 15 }, (_, index) => ({
            date: blockedDate,
            quarter: startMinute / 15 + index,
            kind: CoachingSlotKind.BLOCKED,
          })),
        },
      },
    });
    refreshTradingDashboard();
    return { success: true, message: "Availability block saved." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "That time overlaps an existing reservation or availability block." };
    }
    if (error instanceof FormError) return { success: false, message: error.message };
    console.error("[trading] Availability block could not be saved:", error);
    return { success: false, message: "The availability block could not be saved. Check the database connection and try again." };
  }
}

export async function removeCoachingAvailabilityBlock(formData: FormData) {
  await requireTradingAdmin();
  const id = requestId(formData);
  await prisma.coachingAvailabilityBlock.delete({ where: { id } });
  refreshTradingDashboard();
}