import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { PrismaClient, UserRole } from "@prisma/client";

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
  }, { timeout: 15_000 });

  const [adminCount, vipSettings] = await Promise.all([
    prisma.user.count({ where: { username: adminUsername, role: UserRole.ADMIN } }),
    prisma.vipPlatformSetting.count(),
  ]);

  console.log("Database seed complete (existing records preserved):");
  console.log(`VIP platform settings: ${vipSettings}`);
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