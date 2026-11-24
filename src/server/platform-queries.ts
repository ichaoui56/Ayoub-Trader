import "server-only";

import { FinancialTransactionType, VipMembershipStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { getActiveAdmin } from "./dashboard-auth";
import { getVipClient } from "./vip-auth";
import { prisma } from "./prisma";
import { getVipPublicSettings } from "./vip-data";

async function requirePlatformAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return admin;
}

export async function getPlatformUsers(search?: string) {
  await requirePlatformAdmin();
  const query = search?.trim();
  const customers = await prisma.tradingCustomer.findMany({
    where: query ? {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { clientId: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { account: { is: { email: { contains: query, mode: "insensitive" } } } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 1000,
    select: {
      id: true, clientId: true, name: true, phone: true, email: true, createdAt: true,
      account: { select: { email: true, emailVerifiedAt: true } },
      memberships: {
        orderBy: { createdAt: "desc" }, take: 1,
        include: { assignments: { where: { revokedAt: null }, include: { room: { select: { id: true, slug: true, name: true } } } } },
      },
    },
  });
  return customers.map((customer) => ({
    ...customer,
    email: customer.account?.email ?? customer.email,
    createdAt: customer.createdAt.toISOString(),
    rooms: customer.memberships.flatMap((membership) => membership.assignments.map(({ room }) => room)),
    activeMembership: customer.memberships.some((membership) => membership.status === VipMembershipStatus.ACTIVE && membership.expiresAt > new Date()),
    emailVerified: Boolean(customer.account?.emailVerifiedAt),
  }));
}

export async function getPlatformUserDetail(id: string) {
  await requirePlatformAdmin();
  const customer = await prisma.tradingCustomer.findUnique({
    where: { id },
    include: {
      account: { select: { email: true, emailVerifiedAt: true, createdAt: true } },
      memberships: {
        orderBy: { createdAt: "desc" },
        include: { application: { select: { status: true, brokerOption: true, createdAt: true } }, assignments: { include: { room: { select: { id: true, name: true, slug: true } } } } },
      },
      payments: { orderBy: { createdAt: "desc" }, take: 100 },
      financialTransactions: { orderBy: { createdAt: "desc" }, take: 100, include: { room: { select: { name: true } } } },
      copyTradingApplications: { orderBy: { createdAt: "desc" }, take: 50 },
      coachingBookings: { orderBy: { createdAt: "desc" }, take: 50, include: { sessions: { orderBy: { date: "asc" }, take: 100 } } },
    },
  });
  if (!customer) notFound();
  return {
    ...customer,
    email: customer.account?.email ?? customer.email,
    createdAt: customer.createdAt.toISOString(),
    memberships: customer.memberships.map((membership) => ({ ...membership, startsAt: membership.startsAt.toISOString(), expiresAt: membership.expiresAt.toISOString(), createdAt: membership.createdAt.toISOString() })),
    payments: customer.payments.map((payment) => ({ ...payment, amount: Number(payment.amount), createdAt: payment.createdAt.toISOString() })),
    financialTransactions: customer.financialTransactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount), createdAt: transaction.createdAt.toISOString() })),
    copyTradingApplications: customer.copyTradingApplications.map((application) => ({ ...application, accountBalance: Number(application.accountBalance), createdAt: application.createdAt.toISOString() })),
    coachingBookings: customer.coachingBookings.map((booking) => ({ ...booking, startDate: booking.startDate.toISOString().slice(0, 10), endDate: booking.endDate.toISOString().slice(0, 10), createdAt: booking.createdAt.toISOString(), sessions: booking.sessions.map((session) => ({ ...session, date: session.date.toISOString().slice(0, 10) })) })),
  };
}

export async function getPlatformRoomData(slug: string) {
  await requirePlatformAdmin();
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(slug)) notFound();
  const room = await prisma.vipRoom.findUnique({
    where: { slug },
    include: {
      _count: { select: { assignments: true, transactions: true, posts: true } },
      assignments: {
        where: { revokedAt: null, membership: { status: VipMembershipStatus.ACTIVE, expiresAt: { gt: new Date() } } },
        orderBy: { assignedAt: "desc" },
        include: { customer: { select: { id: true, clientId: true, name: true, phone: true, email: true, createdAt: true, account: { select: { email: true } } } }, membership: { select: { id: true, status: true, startsAt: true, expiresAt: true } } },
      },
      transactions: { where: { type: FinancialTransactionType.PROFIT, status: "COMPLETED" }, orderBy: { createdAt: "asc" }, take: 5000, include: { customer: { select: { name: true } } } },
      posts: { where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 12, select: { id: true, title: true, publishedAt: true } },
    },
  });
  if (!room) notFound();
  const eligibleMemberships = await prisma.vipMembership.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
      assignments: { none: { roomId: room.id, revokedAt: null } },
      customer: { roomAssignments: { none: { roomId: room.id, revokedAt: null } } },
    },
    orderBy: [{ customer: { name: "asc" } }, { createdAt: "desc" }],
    select: {
      id: true,
      expiresAt: true,
      customer: { select: { id: true, clientId: true, name: true, email: true, account: { select: { email: true } } } },
    },
  });
  const eligibleCustomerIds = new Set<string>();
  const assignableCustomers = eligibleMemberships.flatMap((membership) => {
    if (eligibleCustomerIds.has(membership.customer.id)) return [];
    eligibleCustomerIds.add(membership.customer.id);
    return [{
      membershipId: membership.id,
      customerId: membership.customer.id,
      clientId: membership.customer.clientId,
      name: membership.customer.name,
      email: membership.customer.account?.email ?? membership.customer.email,
      expiresAt: membership.expiresAt.toISOString(),
    }];
  });
  const { _count, ...roomData } = room;
  return {
    ...roomData,
    createdAt: room.createdAt.toISOString(),
    members: room.assignments.map((assignment) => ({
      id: assignment.customer.id,
      assignmentId: assignment.id,
      membershipId: assignment.membership.id,
      clientId: assignment.customer.clientId,
      name: assignment.customer.name,
      email: assignment.customer.account?.email ?? assignment.customer.email,
      phone: assignment.customer.phone,
      createdAt: assignment.customer.createdAt.toISOString(),
      status: assignment.membership.status,
      expiresAt: assignment.membership.expiresAt.toISOString(),
    })),
    transactions: room.transactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount), createdAt: transaction.createdAt.toISOString() })),
    eligibleCustomers: assignableCustomers,
    deletionBlockers: _count,
  };
}

export async function getPlatformRooms() {
  await requirePlatformAdmin();
  const now = new Date();
  const rooms = await prisma.vipRoom.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          assignments: { where: { revokedAt: null, membership: { status: "ACTIVE", expiresAt: { gt: now } } } },
        },
      },
    },
  });
  return rooms.map(({ _count, ...room }) => ({
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
    membersCount: _count.assignments,
  }));
}

export async function getFinancialLedger(typeInput?: string) {
  await requirePlatformAdmin();
  const type = typeInput && Object.values(FinancialTransactionType).includes(typeInput as FinancialTransactionType)
    ? typeInput as FinancialTransactionType
    : undefined;
  const [transactions, customers] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" }, take: 2000,
      include: { customer: { select: { id: true, name: true, email: true } }, room: { select: { name: true, slug: true } }, createdBy: { select: { username: true } }, reviewedBy: { select: { username: true } } },
    }),
    prisma.tradingCustomer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, account: { select: { email: true } } } }),
  ]);
  const activeApplications = await prisma.copyTradingApplication.findMany({
    where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 500,
    include: { customer: { select: { id: true, name: true } } },
  });
  return {
    customers: customers.map(({ account, ...customer }) => ({ ...customer, email: account?.email ?? customer.email })),
    transactions: transactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount), createdAt: transaction.createdAt.toISOString(), updatedAt: transaction.updatedAt.toISOString() })),
    activeApplications: activeApplications.map((application) => ({ id: application.id, brokerName: application.brokerName, customerId: application.customerId, customerName: application.customer.name, createdAt: application.createdAt.toISOString() })),
  };
}

export async function getPlatformCoachingSchedule() {
  await requirePlatformAdmin();
  const bookings = await prisma.coachingBooking.findMany({
    orderBy: { startDate: "asc" }, take: 500,
    include: { customer: { select: { id: true, name: true, email: true, phone: true, account: { select: { email: true } } } }, sessions: { orderBy: { date: "asc" }, take: 100 } },
  });
  return bookings.map((booking) => ({
    id: booking.id,
    customerId: booking.customerId,
    customer: booking.customer.name,
    email: booking.customer.account?.email ?? booking.customer.email,
    phone: booking.customer.phone,
    package: booking.package,
    status: booking.status,
    startDate: booking.startDate.toISOString().slice(0, 10),
    endDate: booking.endDate.toISOString().slice(0, 10),
    sessions: booking.sessions.map((session) => ({ id: session.id, date: session.date.toISOString().slice(0, 10), startMinute: session.startMinute, durationMinutes: session.durationMinutes, status: session.status })),
  }));
}

export async function getCustomerAppData() {
  const client = await getVipClient();
  if (!client) throw new Error("Sign in required.");
  const [memberships, transactions, bookings, notifications, rooms, applications, assignedRooms, copyTradingApplications, settings] = await Promise.all([
    prisma.vipMembership.findMany({
      where: { customerId: client.id }, orderBy: { createdAt: "desc" },
      include: { assignments: { where: { revokedAt: null }, include: { room: { select: { id: true, slug: true, name: true, description: true, coverImage: true } } } } },
    }),
    prisma.financialTransaction.findMany({ where: { customerId: client.id }, orderBy: { createdAt: "desc" }, take: 50, include: { room: { select: { name: true } } } }),
    prisma.coachingBooking.findMany({ where: { customerId: client.id }, orderBy: { createdAt: "desc" }, take: 30, include: { sessions: { orderBy: { date: "asc" }, take: 100 } } }),
    prisma.vipNotification.findMany({ where: { customerId: client.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.vipRoom.findMany({ where: { isPublished: true }, orderBy: { name: "asc" }, select: { id: true, slug: true, name: true, category: true, description: true, coverImage: true, _count: { select: { posts: { where: { publishedAt: { not: null } } } } } } }),
    prisma.privateRoomRequest.findMany({ where: { customerId: client.id }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, status: true, brokerOption: true, createdAt: true, proofReportedAt: true, adminFeedback: true, payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, amount: true, currency: true } } } }),
    prisma.vipRoomAssignment.findMany({ where: { customerId: client.id, revokedAt: null, room: { isPublished: true }, membership: { status: "ACTIVE", expiresAt: { gt: new Date() } } }, include: { room: { include: { posts: { where: { publishedAt: { not: null } }, orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }], take: 30, include: { attachments: { select: { id: true, filename: true, mimeType: true } } } } } } } }),
    prisma.copyTradingApplication.findMany({ where: { customerId: client.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, brokerName: true, serverName: true, status: true, reviewedAt: true, authorizedAt: true, activatedAt: true, createdAt: true } }),
    getVipPublicSettings(),
  ]);
  return {
    client,
    memberships: memberships.map((membership) => ({ ...membership, startsAt: membership.startsAt.toISOString(), expiresAt: membership.expiresAt.toISOString(), assignments: membership.assignments.map((assignment) => ({ ...assignment, room: assignment.room })) })),
    transactions: transactions.map((transaction) => ({ ...transaction, amount: Number(transaction.amount), createdAt: transaction.createdAt.toISOString() })),
    bookings: bookings.map((booking) => ({ ...booking, priceDh: Number(booking.priceDh), startDate: booking.startDate.toISOString().slice(0, 10), endDate: booking.endDate.toISOString().slice(0, 10), sessions: booking.sessions.map((session) => ({ ...session, date: session.date.toISOString().slice(0, 10) })) })),
    notifications: notifications.map((notification) => ({ ...notification, createdAt: notification.createdAt.toISOString() })),
    rooms,
    applications: applications.map((application) => ({ ...application, createdAt: application.createdAt.toISOString(), proofReportedAt: application.proofReportedAt?.toISOString() ?? null, payments: application.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })) })),
    assignedRooms: assignedRooms.map(({ room }) => ({ ...room, createdAt: room.createdAt.toISOString(), updatedAt: room.updatedAt.toISOString(), posts: room.posts.map((post) => ({ ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt.toISOString(), publishedAt: post.publishedAt?.toISOString() ?? null })) })),
    copyTradingApplications: copyTradingApplications.map((application) => ({ ...application, reviewedAt: application.reviewedAt?.toISOString() ?? null, authorizedAt: application.authorizedAt?.toISOString() ?? null, activatedAt: application.activatedAt?.toISOString() ?? null, createdAt: application.createdAt.toISOString() })),
    settings,
  };
}