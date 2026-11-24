import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { PrismaClient, PrivateRoomRequestStatus, VipBrokerOption, VipMembershipStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();
const vipSeedSettings = {
  brokerName: process.env.VIP_BROKER_NAME ?? "Ayoub Trader Broker",
  brokerLogo: process.env.VIP_BROKER_LOGO_URL ?? "",
  brokerReferralUrl: process.env.AYOUB_BROKER_REFERRAL_URL ?? "",
  depositRequirements: process.env.VIP_DEPOSIT_REQUIREMENTS ?? "Complete the broker deposit required for VIP eligibility. Keep your confirmation screenshot for WhatsApp verification.",
  whatsappNumber: process.env.AYOUB_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  ownBrokerPrice: "80",
  ownBrokerCurrency: "USD",
  ownBrokerPaymentInstructions: process.env.VIP_OWN_BROKER_PAYMENT_INSTRUCTIONS ?? "",
  membershipDurationMonths: "2",
  supportEmail: process.env.VIP_SUPPORT_EMAIL ?? process.env.CONTACT_EMAIL ?? "",
};

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function seed() {
  const adminUsername = (process.env.TRANSFER_ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  const adminEmail = process.env.TRANSFER_ADMIN_EMAIL?.trim().toLowerCase() || undefined;
  const adminPassword = process.env.TRANSFER_ADMIN_PASSWORD;
  if (adminUsername.length === 0 || adminUsername.length > 100) {
    throw new Error("TRANSFER_ADMIN_USERNAME must be between 1 and 100 characters.");
  }
  if (adminPassword && adminPassword.length < 8) {
    throw new Error("TRANSFER_ADMIN_PASSWORD must be at least 8 characters.");
  }
  if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error("TRANSFER_ADMIN_EMAIL must be a valid email address.");
  }
  const adminPasswordHash = adminPassword ? await hashPassword(adminPassword) : null;

  const demoPassword = process.env.VIP_DEMO_PASSWORD ?? "TraderDemo123!";
  if (demoPassword.length < 10) {
    throw new Error("VIP_DEMO_PASSWORD must be at least 10 characters.");
  }
  const demoPasswordHash = await hashPassword(demoPassword);

  await prisma.$transaction(async (transaction) => {
    if (adminPasswordHash) {
      await transaction.user.upsert({
        where: { username: adminUsername },
        update: { passwordHash: adminPasswordHash, ...(adminEmail ? { email: adminEmail } : {}), role: UserRole.ADMIN, isActive: true },
        create: { username: adminUsername, email: adminEmail, passwordHash: adminPasswordHash, role: UserRole.ADMIN },
      });
    }
    for (const room of [
      { slug: "vip", name: "VIP Room", category: "VIP", description: "Private market analysis and member updates." },
      { slug: "pro", name: "Pro Room", category: "Pro", description: "Structured trading ideas for Pro members." },
      { slug: "standard", name: "Standard Room", category: "Standard", description: "Market education and community updates." },
    ]) {
      await transaction.vipRoom.upsert({
        where: { slug: room.slug },
        create: { ...room, isPublished: true },
        update: {},
      });
    }
    for (const [key, value] of Object.entries(vipSeedSettings)) {
      await transaction.vipPlatformSetting.upsert({
        where: { key },
        create: { key, value },
        update: {},
      });
    }

    const demoTraders = [
      { name: "Adam El Mansouri", phone: "+212600000001", email: "adam.trader@example.com", username: "adam.trader", roomSlug: "vip" },
      { name: "Sara Benali", phone: "+212600000002", email: "sara.trader@example.com", username: "sara.trader", roomSlug: "pro" },
      { name: "Yassine Amrani", phone: "+212600000003", email: "yassine.trader@example.com", username: "yassine.trader", roomSlug: "standard" },
    ];

    for (const trader of demoTraders) {
      const customer = await transaction.tradingCustomer.upsert({
        where: { phone: trader.phone },
        create: { name: trader.name, phone: trader.phone, email: trader.email },
        update: { name: trader.name, email: trader.email },
      });

      await transaction.tradingCustomerAccount.upsert({
        where: { customerId: customer.id },
        create: {
          customerId: customer.id,
          username: trader.username,
          email: trader.email,
          passwordHash: demoPasswordHash,
          emailVerifiedAt: new Date(),
        },
        update: {
          username: trader.username,
          email: trader.email,
          passwordHash: demoPasswordHash,
          emailVerifiedAt: new Date(),
          failedLoginCount: 0,
          lockedUntil: null,
        },
      });

      let application = await transaction.privateRoomRequest.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: "desc" },
      });
      if (!application) {
        application = await transaction.privateRoomRequest.create({
          data: {
            customerId: customer.id,
            status: PrivateRoomRequestStatus.VIP_ACTIVE,
            brokerOption: VipBrokerOption.OUR_BROKER,
            depositVerifiedAt: new Date(),
            vipGrantedAt: new Date(),
            vipExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const startsAt = new Date();
      const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const membership = await transaction.vipMembership.upsert({
        where: { applicationId: application.id },
        create: {
          customerId: customer.id,
          applicationId: application.id,
          brokerOption: VipBrokerOption.OUR_BROKER,
          status: VipMembershipStatus.ACTIVE,
          startsAt,
          expiresAt,
        },
        update: { status: VipMembershipStatus.ACTIVE, startsAt, expiresAt },
      });

      const room = await transaction.vipRoom.findUnique({ where: { slug: trader.roomSlug } });
      if (room) {
        await transaction.vipRoomAssignment.upsert({
          where: { membershipId_roomId: { membershipId: membership.id, roomId: room.id } },
          create: { customerId: customer.id, membershipId: membership.id, roomId: room.id },
          update: { revokedAt: null },
        });
      }
    }
  }, { timeout: 15_000 });

  const [adminCount, vipSettings, demoCustomerCount] = await Promise.all([
    prisma.user.count({ where: { username: adminUsername, role: UserRole.ADMIN } }),
    prisma.vipPlatformSetting.count(),
    prisma.tradingCustomer.count({ where: { phone: { in: ["+212600000001", "+212600000002", "+212600000003"] } } }),
  ]);

  console.log("Database seed complete (existing records preserved):");
  console.log(`VIP platform settings: ${vipSettings}`);
  console.log(`Demo trading customers: ${demoCustomerCount}`);
  console.log(`Admin user: ${adminCount ? "present" : adminPasswordHash ? "not seeded" : "skipped (set TRANSFER_ADMIN_PASSWORD to seed)"}`);
}

seed()
  .catch((error: unknown) => {
    console.error("Database seed failed.", error instanceof Error ? error.message : "Unknown error.");
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });