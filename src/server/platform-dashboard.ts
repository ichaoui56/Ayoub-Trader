import "server-only";

import { FinancialTransactionStatus, FinancialTransactionType } from "@prisma/client";
import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";

export type DashboardPeriod = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

const periodDays: Record<DashboardPeriod, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

function normalizedPeriod(value?: string): DashboardPeriod {
  return value && value in periodDays ? value as DashboardPeriod : "1M";
}

export async function getPlatformOverview(periodInput?: string, roomSlug?: string, currencyInput?: string) {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");

  const period = normalizedPeriod(periodInput);
  const currency = currencyInput && /^[A-Z]{3}$/.test(currencyInput) ? currencyInput : "all";
  const requestedRoomSlug = roomSlug && /^[a-z0-9][a-z0-9-]{0,59}$/.test(roomSlug) ? roomSlug : "all";
  const now = new Date();
  const rangeStart = new Date(now.getTime() - periodDays[period] * 86_400_000);
  const [customers, activeMembers, pendingApplications, rooms, recentUsers, deposits, profits, withdrawals, recentTransactions, profitRows] = await Promise.all([
    prisma.tradingCustomer.count(),
    prisma.vipMembership.count({ where: { status: "ACTIVE", expiresAt: { gt: now } } }),
    prisma.privateRoomRequest.count({ where: { status: { in: ["SUBMITTED", "DEPOSIT_VERIFIED", "UNDER_REVIEW", "PROOF_REPORTED"] } } }),
    prisma.vipRoom.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            assignments: {
              where: {
                revokedAt: null,
                membership: { status: "ACTIVE", expiresAt: { gt: now } },
              },
            },
          },
        },
      },
    }),
    prisma.tradingCustomer.findMany({
      orderBy: { createdAt: "desc" }, take: 6,
      select: {
        id: true, name: true, email: true, createdAt: true,
        account: { select: { email: true, emailVerifiedAt: true } },
        memberships: { where: { status: "ACTIVE", expiresAt: { gt: now } }, select: { id: true }, take: 1 },
      },
    }),
    prisma.financialTransaction.groupBy({ by: ["currency"], where: { type: FinancialTransactionType.DEPOSIT, status: { in: [FinancialTransactionStatus.VERIFIED, FinancialTransactionStatus.COMPLETED] } }, _sum: { amount: true } }),
    prisma.financialTransaction.groupBy({ by: ["currency"], where: { type: FinancialTransactionType.PROFIT, status: FinancialTransactionStatus.COMPLETED }, _sum: { amount: true } }),
    prisma.financialTransaction.groupBy({ by: ["currency"], where: { type: FinancialTransactionType.WITHDRAWAL, status: { in: [FinancialTransactionStatus.VERIFIED, FinancialTransactionStatus.COMPLETED] } }, _sum: { amount: true } }),
    prisma.financialTransaction.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      include: { customer: { select: { id: true, name: true } }, room: { select: { name: true, slug: true } } },
    }),
    prisma.financialTransaction.findMany({
      where: {
        type: FinancialTransactionType.PROFIT,
        status: FinancialTransactionStatus.COMPLETED,
        createdAt: { gte: rangeStart, lte: now },
        ...(currency !== "all" ? { currency } : {}),
        ...(requestedRoomSlug !== "all" ? { room: { slug: requestedRoomSlug } } : {}),
      },
      orderBy: { createdAt: "asc" }, take: 5000,
      select: { amount: true, currency: true, createdAt: true, roomId: true, room: { select: { name: true, slug: true } } },
    }),
  ]);

  const series = new Map<string, Map<string, { label: string; total: number }>>();
  for (const row of profitRows) {
    const bucket = period === "1D"
      ? `${row.createdAt.toISOString().slice(0, 13)}:00Z`
      : period === "1Y" || period === "6M"
        ? row.createdAt.toISOString().slice(0, 7)
        : period === "3M"
          ? new Date(Date.UTC(row.createdAt.getUTCFullYear(), row.createdAt.getUTCMonth(), row.createdAt.getUTCDate() - row.createdAt.getUTCDay())).toISOString().slice(0, 10)
          : row.createdAt.toISOString().slice(0, 10);
    const label = period === "1D"
      ? `${bucket.slice(11, 13)}:00`
      : period === "1Y" || period === "6M"
        ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${bucket}-01T00:00:00Z`))
        : new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${bucket}T00:00:00Z`));
    const currencySeries = series.get(row.currency) ?? new Map<string, { label: string; total: number }>();
    const current = currencySeries.get(bucket) ?? { label, total: 0 };
    current.total += Number(row.amount);
    currencySeries.set(bucket, current);
    series.set(row.currency, currencySeries);
  }

  const roomProfit = new Map<string, { name: string; slug: string; currency: string; profit: number }>();
  for (const row of profitRows) {
    if (!row.room) continue;
    const roomKey = `${row.currency}:${row.room.slug}`;
    const current = roomProfit.get(roomKey) ?? { name: row.room.name, slug: row.room.slug, currency: row.currency, profit: 0 };
    current.profit += Number(row.amount);
    roomProfit.set(roomKey, current);
  }
  const currencies = [...new Set(profitRows.map((row) => row.currency))].sort();
  const topRoom = currency !== "all"
    ? [...roomProfit.values()].filter((room) => room.currency === currency).sort((first, second) => second.profit - first.profit)[0] ?? null
    : currencies.length === 1
      ? [...roomProfit.values()].sort((first, second) => second.profit - first.profit)[0] ?? null
      : null;

  return {
    period,
    roomSlug: requestedRoomSlug !== "all" && rooms.some((room) => room.slug === requestedRoomSlug) ? requestedRoomSlug : "all",
    summary: {
      users: customers,
      activeMembers,
      pendingApplications,
      deposits: deposits.map(({ currency, _sum }) => ({ currency, amount: Number(_sum.amount ?? 0) })),
      profit: profits.map(({ currency, _sum }) => ({ currency, amount: Number(_sum.amount ?? 0) })),
      withdrawals: withdrawals.map(({ currency, _sum }) => ({ currency, amount: Number(_sum.amount ?? 0) })),
    },
    rooms: rooms.map((room) => ({ id: room.id, slug: room.slug, name: room.name, category: room.category, members: room._count.assignments })),
    recentUsers: recentUsers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.account?.email ?? customer.email,
      emailVerified: Boolean(customer.account?.emailVerifiedAt),
      hasActiveMembership: customer.memberships.length > 0,
      createdAt: customer.createdAt.toISOString(),
    })),
    transactions: recentTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      reference: transaction.reference,
      customer: transaction.customer.name,
      room: transaction.room?.name ?? null,
      createdAt: transaction.createdAt.toISOString(),
    })),
    performance: [...series.entries()].map(([currency, points]) => ({ currency, points: [...points.values()] })),
    performanceStats: [...profitRows.reduce((stats, row) => {
      const current = stats.get(row.currency) ?? { currency: row.currency, entries: 0, total: 0 };
      current.entries += 1;
      current.total += Number(row.amount);
      stats.set(row.currency, current);
      return stats;
    }, new Map<string, { currency: string; entries: number; total: number }>()).values()].map((stat) => ({
      ...stat,
      average: stat.entries ? stat.total / stat.entries : 0,
    })),
    currencies,
    currency,
    topRoom,
  };
}