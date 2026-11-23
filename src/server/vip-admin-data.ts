import "server-only";

import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";
import { maintainVipMemberships } from "./vip-data";

export async function getVipAdminData() {
  if (!(await getActiveAdmin())) throw new Error("An active administrator is required.");
  await maintainVipMemberships();
  const [customers, applications, memberships, rooms, settings] = await Promise.all([
    prisma.tradingCustomer.findMany({ orderBy: { createdAt: "desc" }, take: 1000, select: { id: true, clientId: true, name: true, phone: true, email: true } }),
    prisma.privateRoomRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 300,
      select: {
        id: true, status: true, brokerOption: true, createdAt: true, proofReportedAt: true,
        depositVerifiedAt: true, depositProof: true,
        customer: { select: { id: true, clientId: true, name: true, phone: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true, amount: true, currency: true, status: true } },
      },
    }).then((rows) => rows.map(({ depositProof, ...request }) => ({ ...request, hasDepositProof: Boolean(depositProof) }))),
    prisma.vipMembership.findMany({
      orderBy: { expiresAt: "desc" }, take: 300,
      include: {
        customer: { select: { id: true, clientId: true, name: true, phone: true } },
        assignments: { where: { revokedAt: null }, select: { roomId: true, room: { select: { name: true } } } },
      },
    }),
    prisma.vipRoom.findMany({
      orderBy: [{ isPublished: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { assignments: { where: { revokedAt: null } }, posts: { where: { publishedAt: { not: null } } } } },
        posts: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, publishedAt: true, isPinned: true } },
      },
    }),
    prisma.vipPlatformSetting.findMany(),
  ]);
  return {
    customers,
    applications: applications.map((request) => ({
      ...request,
      payments: request.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    })),
    memberships,
    rooms,
    settings: Object.fromEntries(settings.map(({ key, value }) => [key, value])),
  };
}