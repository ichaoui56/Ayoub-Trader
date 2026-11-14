import "server-only";

import { CoachingBookingStatus, PrivateRoomRequestStatus } from "@prisma/client";
import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";

export type TradingDashboardData = {
  customers: Array<{ id: string; name: string; phone: string; email: string | null; createdAt: string }>;
  privateRooms: Array<{
    id: string;
    status: string;
    hasDepositProof: boolean;
    depositVerifiedAt: string | null;
    vipGrantedAt: string | null;
    vipExpiresAt: string | null;
    createdAt: string;
    customer: { name: string; phone: string; email: string | null };
    payments: Array<{ id: string; amount: number; currency: string; status: string }>;
  }>;
  copyTrading: Array<{
    id: string;
    brokerName: string;
    accountBalance: number;
    status: string;
    createdAt: string;
    customer: { name: string; phone: string; email: string | null };
    payments: Array<{ id: string; amount: number; currency: string; status: string; note: string }>;
  }>;
  coaching: Array<{
    id: string;
    package: string;
    status: string;
    priceDh: number;
    startDate: string;
    endDate: string;
    dailyStartMinute: number;
    durationMinutes: number;
    expectedSessions: number;
    remainingSessions: number;
    createdAt: string;
    customer: { name: string; phone: string; email: string | null };
    payments: Array<{ id: string; status: string }>;
    sessions: Array<{ id: string; date: string; startMinute: number; status: string }>;
  }>;
  payments: Array<{
    id: string;
    service: string;
    amount: number;
    currency: string;
    status: string;
    note: string;
    createdAt: string;
    customer: { name: string; phone: string };
    privateRoomRequestId: string | null;
    coachingBookingId: string | null;
  }>;
  blocks: Array<{ id: string; date: string; startMinute: number; endMinute: number; reason: string }>;
};

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function moroccoToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function expireSubscriptions() {
  const now = new Date();
  const today = new Date(`${moroccoToday()}T00:00:00.000Z`);
  await Promise.all([
    prisma.privateRoomRequest.updateMany({
      where: { status: PrivateRoomRequestStatus.VIP_ACTIVE, vipExpiresAt: { lte: now } },
      data: { status: PrivateRoomRequestStatus.EXPIRED },
    }),
    prisma.coachingBooking.updateMany({
      where: { status: CoachingBookingStatus.ACTIVE, endDate: { lte: today } },
      data: { status: CoachingBookingStatus.EXPIRED },
    }),
  ]);
}

export async function getTradingDashboardData(): Promise<TradingDashboardData> {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required to view trading records.");
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before managing trading services.");
  await expireSubscriptions();

  const [customers, privateRooms, copyTrading, coaching, payments, blocks] = await Promise.all([
    prisma.tradingCustomer.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    }),
    prisma.privateRoomRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, status: true, depositProof: true, depositVerifiedAt: true, vipGrantedAt: true, vipExpiresAt: true, createdAt: true,
        customer: { select: { name: true, phone: true, email: true } },
        payments: { select: { id: true, amount: true, currency: true, status: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.copyTradingApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, brokerName: true, accountBalance: true, status: true, createdAt: true,
        customer: { select: { name: true, phone: true, email: true } },
        payments: { select: { id: true, amount: true, currency: true, status: true, note: true }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.coachingBooking.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, package: true, status: true, priceDh: true, startDate: true, endDate: true, dailyStartMinute: true,
        durationMinutes: true, expectedSessions: true, remainingSessions: true, createdAt: true,
        customer: { select: { name: true, phone: true, email: true } },
        payments: { select: { id: true, status: true }, orderBy: { createdAt: "desc" } },
        sessions: { select: { id: true, date: true, startMinute: true, status: true }, orderBy: { date: "asc" } },
      },
    }),
    prisma.manualPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      select: {
        id: true, service: true, amount: true, currency: true, status: true, note: true, createdAt: true,
        privateRoomRequestId: true, coachingBookingId: true,
        customer: { select: { name: true, phone: true } },
      },
    }),
    prisma.coachingAvailabilityBlock.findMany({
      where: { date: { gte: new Date(`${moroccoToday()}T00:00:00.000Z`) } },
      orderBy: [{ date: "asc" }, { startMinute: "asc" }],
      take: 300,
      select: { id: true, date: true, startMinute: true, endMinute: true, reason: true },
    }),
  ]);

  return {
    customers: customers.map((customer) => ({ ...customer, createdAt: customer.createdAt.toISOString() })),
    privateRooms: privateRooms.map((request) => ({
      id: request.id,
      status: request.status,
      hasDepositProof: request.depositProof !== null,
      depositVerifiedAt: request.depositVerifiedAt?.toISOString() ?? null,
      vipGrantedAt: request.vipGrantedAt?.toISOString() ?? null,
      vipExpiresAt: request.vipExpiresAt?.toISOString() ?? null,
      createdAt: request.createdAt.toISOString(),
      customer: request.customer,
      payments: request.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    })),
    copyTrading: copyTrading.map((application) => ({
      ...application,
      accountBalance: Number(application.accountBalance),
      createdAt: application.createdAt.toISOString(),
      payments: application.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    })),
    coaching: coaching.map((booking) => ({
      ...booking,
      startDate: dateOnly(booking.startDate),
      endDate: dateOnly(booking.endDate),
      createdAt: booking.createdAt.toISOString(),
      sessions: booking.sessions.map((session) => ({ ...session, date: dateOnly(session.date) })),
    })),
    payments: payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      createdAt: payment.createdAt.toISOString(),
    })),
    blocks: blocks.map((block) => ({ ...block, date: dateOnly(block.date) })),
  };
}