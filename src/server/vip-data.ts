import "server-only";

import { VipMembershipStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function getVipPublicSettings() {
  const rows = await prisma.vipPlatformSetting.findMany();
  const values = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
  return {
    brokerName: values.brokerName ?? "Ayoub Trader Broker",
    brokerLogo: values.brokerLogo ?? "",
    brokerReferralUrl: values.brokerReferralUrl ?? process.env.AYOUB_BROKER_REFERRAL_URL ?? "",
    depositRequirements: values.depositRequirements ?? "Complete the broker deposit required for VIP eligibility. Keep your confirmation screenshot for WhatsApp verification.",
    whatsappNumber: values.whatsappNumber ?? process.env.AYOUB_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
    ownBrokerPrice: values.ownBrokerPrice ?? "80",
    ownBrokerCurrency: values.ownBrokerCurrency ?? "USD",
    ownBrokerPaymentInstructions: values.ownBrokerPaymentInstructions ?? "",
    membershipDurationMonths: "2",
  };
}

export async function maintainVipMemberships() {
  const now = new Date();
  const expired = await prisma.vipMembership.findMany({
    where: { status: VipMembershipStatus.ACTIVE, expiresAt: { lte: now } },
    select: { id: true, customerId: true, applicationId: true, expiresAt: true },
    take: 500,
  });
  for (const membership of expired) {
    await prisma.$transaction(async (transaction) => {
      const changed = await transaction.vipMembership.updateMany({
        where: { id: membership.id, status: VipMembershipStatus.ACTIVE, expiresAt: { lte: now } },
        data: { status: VipMembershipStatus.EXPIRED },
      });
      if (!changed.count) return;
      await transaction.privateRoomRequest.updateMany({ where: { id: membership.applicationId, status: "VIP_ACTIVE" }, data: { status: "EXPIRED" } });
      await transaction.vipNotification.create({ data: { customerId: membership.customerId, title: "Membership expired", message: "Your VIP membership has expired and room access has ended. Submit a new application to renew." } });
      await transaction.vipAuditLog.create({ data: { action: "VIP_MEMBERSHIP_EXPIRED", subjectId: membership.id, details: { expiredAt: membership.expiresAt.toISOString() } } });
    });
  }

  const reminderWindows = [
    { days: 7, lower: 6 },
    { days: 3, lower: 2 },
  ];
  for (const reminder of reminderWindows) {
    const memberships = await prisma.vipMembership.findMany({
      where: {
        status: VipMembershipStatus.ACTIVE,
        expiresAt: { gt: new Date(now.getTime() + reminder.lower * 86_400_000), lte: new Date(now.getTime() + reminder.days * 86_400_000) },
      },
      select: { id: true, customerId: true, expiresAt: true },
      take: 500,
    });
    for (const membership of memberships) {
      await prisma.$transaction(async (transaction) => {
        const action = `VIP_EXPIRY_REMINDER_${reminder.days}`;
        const alreadySent = await transaction.vipAuditLog.findFirst({ where: { action, subjectId: membership.id }, select: { id: true } });
        if (alreadySent) return;
        await transaction.vipNotification.create({
          data: { customerId: membership.customerId, title: `Membership expires in ${reminder.days} days`, message: `Your membership expires on ${membership.expiresAt.toLocaleDateString("en-US", { dateStyle: "long" })}. Apply to renew before access ends.` },
        });
        await transaction.vipAuditLog.create({ data: { action, subjectId: membership.id, details: { expiresAt: membership.expiresAt.toISOString() } } });
      });
    }
  }
}

export async function getActiveVipMembership(customerId: string) {
  return prisma.vipMembership.findFirst({
    where: { customerId, status: VipMembershipStatus.ACTIVE, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
    include: {
      assignments: {
        where: { revokedAt: null, room: { isPublished: true } },
        include: { room: { select: { id: true, slug: true, name: true, description: true, category: true, coverImage: true, _count: { select: { posts: { where: { publishedAt: { not: null } } } } } } } },
      },
    },
  });
}