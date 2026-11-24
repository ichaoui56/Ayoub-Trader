"use server";

import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { ManualPaymentService, Prisma, PrivateRoomRequestStatus, UserRole, VipBrokerOption } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearDashboardSession, getActiveAdmin, setDashboardSession } from "./dashboard-auth";
import { prisma } from "./prisma";
import {
  clearVipClientSession,
  getVipClient,
  hashVipPassword,
  newVipVerificationToken,
  setVipClientSession,
  verifyVipPassword,
} from "./vip-auth";
import { sendVipVerificationEmail } from "./vip-email";

export type VipAuthActionState = { success: boolean; message: string };
export type CopyTradingRequestState = { success: boolean; message: string };

function formString(data: FormData, key: string, label: string, maxLength: number) {
  const value = data.get(key);
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) throw new Error(`${label} is invalid.`);
  return cleaned;
}

function encryptCopyTradingSecret(value: string) {
  const secret = process.env.COPY_TRADING_CREDENTIAL_SECRET ?? process.env.VIP_CLIENT_SECRET ?? process.env.TRANSFER_DASHBOARD_SECRET;
  if (!secret || secret.length < 32) throw new Error("Copy-trading credential encryption is not configured.");
  const key = createHash("sha256").update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), encrypted.toString("base64url"), tag.toString("base64url")].join(".");
}

export async function submitCopyTradingRequest(_state: CopyTradingRequestState, data: FormData): Promise<CopyTradingRequestState> {
  try {
    const client = await getVipClient();
    if (!client) return { success: false, message: "Sign in to submit copy-trading access." };

    const brokerName = formString(data, "brokerName", "Broker name", 120);
    const brokerLogin = formString(data, "brokerLogin", "Broker login", 120);
    const brokerPassword = formString(data, "brokerPassword", "Broker password", 256);
    const serverName = formString(data, "serverName", "Trading server", 120);
    const serverIp = formString(data, "serverIp", "Server IP", 80);

    const existing = await prisma.copyTradingApplication.findFirst({
      where: { customerId: client.id, status: { in: ["NEW", "UNDER_REVIEW", "AUTHORIZATION_PENDING", "AUTHORIZED", "ACTIVE"] } },
      select: { id: true },
    });
    if (existing) return { success: false, message: "You already have a copy-trading request in progress." };

    await prisma.$transaction(async (transaction) => {
      const application = await transaction.copyTradingApplication.create({
        data: {
          customerId: client.id,
          brokerName,
          accountBalance: new Prisma.Decimal("0"),
          brokerLogin,
          brokerPasswordEncrypted: encryptCopyTradingSecret(brokerPassword),
          serverName,
          serverIp,
        },
        select: { id: true },
      });
      await transaction.vipNotification.create({
        data: { customerId: client.id, title: "Copy trading submitted", message: "Your request is under review. We will notify you after the administrator checks it." },
      });
      await transaction.vipAuditLog.create({
        data: { actorId: null, action: "COPY_TRADING_REQUEST_SUBMITTED", subjectId: application.id, details: { customerId: client.id, brokerName, serverName } },
      });
    });
    revalidatePath("/app/copy-trading");
    return { success: true, message: "Request submitted successfully. Copy trading will unlock after administrator approval." };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "We could not submit the request." };
  }
}

function normalizePhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  const phone = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Enter a WhatsApp number with its country code.");
  return phone;
}

function authFailure(error: unknown): VipAuthActionState {
  if (error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return { success: false, message: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, message: "An account already uses that username, email, or phone number." };
  }
  console.error("[vip-auth] Client authentication failed:", error);
  return { success: false, message: "We could not complete that request. Please try again." };
}

function verificationUrl(token: string) {
  const baseUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://mhtraveling.com";
  return new URL(`/vip/verify?token=${encodeURIComponent(token)}`, baseUrl).toString();
}

export async function registerVipClient(_state: VipAuthActionState, data: FormData): Promise<VipAuthActionState> {
  try {
    const name = formString(data, "name", "Full name", 120);
    const phone = normalizePhone(formString(data, "phone", "WhatsApp number", 40));
    const username = formString(data, "username", "Username", 30).toLowerCase();
    const email = formString(data, "email", "Email address", 254).toLowerCase();
    const password = formString(data, "password", "Password", 128);
    if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) throw new Error("Use 3 to 30 letters, numbers, dots, underscores, or hyphens for your username.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (password.length < 10) throw new Error("Use a password with at least 10 characters.");

    const token = newVipVerificationToken();
    const result = await prisma.$transaction(async (transaction) => {
      const existingCustomer = await transaction.tradingCustomer.findUnique({
        where: { phone },
        select: { id: true, name: true, _count: { select: { privateRoomRequests: true } } },
      });
      const existingAccount = existingCustomer
        ? await transaction.tradingCustomerAccount.findUnique({ where: { customerId: existingCustomer.id } })
        : null;
      if (existingCustomer?._count.privateRoomRequests && !existingAccount) {
        throw new Error("This phone number is linked to an earlier VIP application. Contact support to verify and connect that history to your account.");
      }
      if (existingAccount?.emailVerifiedAt) throw new Error("This customer profile already has a verified client account.");
      if (existingAccount && existingAccount.email !== email) throw new Error("This customer profile already has a different account email.");
      const customer = existingCustomer
        ? await transaction.tradingCustomer.update({ where: { id: existingCustomer.id }, data: { name, email }, select: { id: true, name: true } })
        : await transaction.tradingCustomer.create({ data: { name, phone, email }, select: { id: true, name: true } });
      const emailOwner = await transaction.tradingCustomerAccount.findUnique({ where: { email } });
      if (emailOwner && emailOwner.customerId !== customer.id) throw new Error("An account already uses that email address.");
      const usernameOwner = await transaction.tradingCustomerAccount.findUnique({ where: { username } });
      if (usernameOwner && usernameOwner.customerId !== customer.id) throw new Error("That username is already taken.");

      const account = existingAccount
        ? await transaction.tradingCustomerAccount.update({
          where: { id: existingAccount.id },
          data: {
            username,
            passwordHash: await hashVipPassword(password),
            verificationTokenHash: createHash("sha256").update(token.token).digest("hex"),
            verificationExpiresAt: token.expiresAt,
          },
        })
        : await transaction.tradingCustomerAccount.create({
          data: {
            customerId: customer.id,
            username,
            email,
            passwordHash: await hashVipPassword(password),
            verificationTokenHash: createHash("sha256").update(token.token).digest("hex"),
            verificationExpiresAt: token.expiresAt,
          },
        });
      return { account, name: customer.name };
    });

    const delivered = await sendVipVerificationEmail(result.account.email, result.name, verificationUrl(token.token));
    if (!delivered) return { success: false, message: "Your account is saved, but email delivery is not configured. Contact support to verify your email." };
    return { success: true, message: "Check your email for a verification link. It expires in 24 hours." };
  } catch (error) {
    return authFailure(error);
  }
}

export async function signInVipClient(_state: VipAuthActionState, data: FormData): Promise<VipAuthActionState> {
  let destination: "/dashboard" | "/app" | null = null;
  try {
    const identifier = formString(data, "identifier", "Email address or username", 254).toLowerCase();
    const password = formString(data, "password", "Password", 128);
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      select: { id: true, role: true, isActive: true, passwordHash: true },
    });
    if (user) {
      if (user.role !== UserRole.ADMIN || !user.isActive || !(await verifyVipPassword(password, user.passwordHash))) {
        return { success: false, message: "Email, username, or password did not match." };
      }
      await clearVipClientSession();
      await setDashboardSession(user.id);
      destination = "/dashboard";
    } else {
    const account = await prisma.tradingCustomerAccount.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
      select: { customerId: true, passwordHash: true, emailVerifiedAt: true, failedLoginCount: true, lockedUntil: true },
    });
    if (!account) {
      return { success: false, message: "Email, username, or password did not match." };
    }
    if (account.lockedUntil && account.lockedUntil > new Date()) return { success: false, message: "Too many attempts. Wait 15 minutes before trying again." };
    if (!(await verifyVipPassword(password, account.passwordHash))) {
      const failures = account.failedLoginCount + 1;
      await prisma.tradingCustomerAccount.update({
        where: { customerId: account.customerId },
        data: { failedLoginCount: failures, lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null },
      });
      return { success: false, message: "Email, username, or password did not match." };
    }
    if (!account.emailVerifiedAt) return { success: false, message: "Verify your email before signing in." };
    await prisma.tradingCustomerAccount.update({ where: { customerId: account.customerId }, data: { failedLoginCount: 0, lockedUntil: null } });
    await clearDashboardSession();
    await setVipClientSession(account.customerId);
      destination = "/app";
    }
  } catch (error) {
    return authFailure(error);
  }
  redirect(destination ?? "/vip/login");
}

export async function signOutVipClient() {
  await clearVipClientSession();
  redirect("/vip/login");
}

export async function requireVipClient() {
  const client = await getVipClient();
  if (!client) redirect("/vip/login");
  return client;
}

export type VipRequestActionState = {
  success: boolean;
  message: string;
  reference?: string;
  whatsappUrl?: string;
};

const unresolvedStatuses: PrivateRoomRequestStatus[] = [
  PrivateRoomRequestStatus.SUBMITTED,
  PrivateRoomRequestStatus.PROOF_REPORTED,
  PrivateRoomRequestStatus.DEPOSIT_VERIFIED,
  PrivateRoomRequestStatus.UNDER_REVIEW,
  PrivateRoomRequestStatus.MORE_INFO_REQUIRED,
];

async function vipSettings() {
  const rows = await prisma.vipPlatformSetting.findMany();
  return Object.fromEntries(rows.map(({ key, value }) => [key, value]));
}

function clientWhatsappUrl(number: string, message: string) {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : undefined;
}

export async function submitVipApplication(
  _state: VipRequestActionState,
  data: FormData,
): Promise<VipRequestActionState> {
  const client = await getVipClient();
  if (!client) return { success: false, message: "Sign in to submit a VIP application." };

  try {
    const option = formString(data, "brokerOption", "Broker option", 20);
    if (option !== VipBrokerOption.OUR_BROKER && option !== VipBrokerOption.OWN_BROKER) {
      throw new Error("Choose one of the available broker options.");
    }
    const settings = await vipSettings();
    const referralLink = settings.brokerReferralUrl ?? process.env.AYOUB_BROKER_REFERRAL_URL ?? "";
    if (option === VipBrokerOption.OUR_BROKER) {
      try {
        if (new URL(referralLink).protocol !== "https:") throw new Error();
      } catch {
        throw new Error("Our Broker applications are unavailable until a secure referral link is configured.");
      }
    }
    const whatsappNumber = settings.whatsappNumber ?? process.env.AYOUB_WHATSAPP_NUMBER ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
    if (!whatsappNumber.replace(/\D/g, "")) throw new Error("WhatsApp support is not configured yet. Contact support to apply.");
    if (option === VipBrokerOption.OWN_BROKER && !settings.ownBrokerPaymentInstructions?.trim()) {
      throw new Error("Own Broker payment instructions are not configured yet. Contact support to apply.");
    }
    const price = option === VipBrokerOption.OWN_BROKER ? Number(settings.ownBrokerPrice ?? "80") : 0;
    if (!Number.isFinite(price) || price < 0 || price > 10000) throw new Error("The configured membership price is invalid.");

    const prior = await prisma.privateRoomRequest.findFirst({
      where: { customerId: client.id, status: { in: unresolvedStatuses } },
      select: { id: true },
    });
    if (prior) return { success: false, message: "You already have an application in progress. Follow its status before submitting another." };

    const request = await prisma.$transaction(async (transaction) => {
      const created = await transaction.privateRoomRequest.create({
        data: {
          customerId: client.id,
          brokerOption: option,
          ...(option === VipBrokerOption.OWN_BROKER ? {
            payments: {
              create: {
                customerId: client.id,
                service: ManualPaymentService.PRIVATE_ROOM,
                amount: price,
                currency: settings.ownBrokerCurrency ?? "USD",
                note: "Own Broker membership payment; awaiting client proof and manual verification.",
              },
            },
          } : {}),
        },
        select: { id: true },
      });
      await transaction.vipNotification.create({
        data: { customerId: client.id, title: "Application received", message: "Your VIP Private Rooms application is in the queue for manual review." },
      });
      await transaction.vipAuditLog.create({
        data: { action: "VIP_APPLICATION_SUBMITTED", subjectId: created.id, details: { brokerOption: option, customerId: client.id } },
      });
      return created;
    });
    const amount = option === VipBrokerOption.OWN_BROKER ? `Membership: ${settings.ownBrokerCurrency ?? "USD"} ${price.toFixed(2)}. ` : "";
    const message = `Hello Ayoub, I am applying for VIP Private Rooms. Client ID: ${client.clientId}. Application ID: ${request.id}. Broker option: ${option === VipBrokerOption.OUR_BROKER ? "Our Broker" : "Own Broker"}. ${amount}I will attach my proof here.`;
    revalidatePath("/vip/dashboard");
    revalidatePath("/vip/dashboard/rooms");
    return {
      success: true,
      reference: request.id,
      message: "Application received. Continue to WhatsApp, attach your proof, and send the prepared message.",
      whatsappUrl: clientWhatsappUrl(whatsappNumber, message),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "An application was just submitted. Refresh to see its current status." };
    }
    return { success: false, message: error instanceof Error ? error.message : "We could not submit your application." };
  }
}

export async function reportVipProofSent(data: FormData) {
  const client = await getVipClient();
  if (!client) throw new Error("Sign in to update your application.");
  const id = formString(data, "id", "Application", 40);
  const request = await prisma.privateRoomRequest.findFirst({
    where: { id, customerId: client.id },
    select: { id: true, status: true },
  });
  if (!request || !unresolvedStatuses.includes(request.status)) throw new Error("This application is no longer awaiting proof.");
  await prisma.$transaction([
    prisma.privateRoomRequest.update({
      where: { id },
      data: { status: PrivateRoomRequestStatus.PROOF_REPORTED, proofReportedAt: new Date() },
    }),
    prisma.vipNotification.create({
      data: { customerId: client.id, title: "Proof reported", message: "You reported sending your proof through WhatsApp. It is not verified until reviewed by the team." },
    }),
    prisma.vipAuditLog.create({ data: { action: "VIP_PROOF_REPORTED", subjectId: id, details: { customerId: client.id } } }),
  ]);
  revalidatePath("/vip/dashboard");
  revalidatePath("/vip/dashboard/applications");
}

export async function markVipNotificationRead(id: string) {
  const client = await getVipClient();
  if (!client || !/^[A-Za-z0-9_-]{1,40}$/.test(id)) return;
  await prisma.vipNotification.updateMany({ where: { id, customerId: client.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/vip/dashboard");
  revalidatePath("/vip/dashboard/notifications");
}

export type VipProfileActionState = { success: boolean; message: string };

export async function updateVipProfile(_state: VipProfileActionState, data: FormData): Promise<VipProfileActionState> {
  const client = await getVipClient();
  if (!client) return { success: false, message: "Sign in to update your profile." };
  try {
    const name = formString(data, "name", "Full name", 120);
    const phone = normalizePhone(formString(data, "phone", "WhatsApp number", 40));
    const currentPassword = formString(data, "currentPassword", "Current password", 128);
    const newPasswordValue = data.get("newPassword");
    if (typeof newPasswordValue !== "string" || newPasswordValue.length > 128) throw new Error("The new password is invalid.");
    const account = await prisma.tradingCustomerAccount.findUnique({
      where: { customerId: client.id },
      select: { id: true, passwordHash: true },
    });
    if (!account || !(await verifyVipPassword(currentPassword, account.passwordHash))) throw new Error("Your current password did not match.");
    if (newPasswordValue && newPasswordValue.length < 10) throw new Error("New passwords must have at least 10 characters.");
    await prisma.$transaction(async (transaction) => {
      await transaction.tradingCustomer.update({ where: { id: client.id }, data: { name, phone } });
      if (newPasswordValue) {
        await transaction.tradingCustomerAccount.update({ where: { id: account.id }, data: { passwordHash: await hashVipPassword(newPasswordValue) } });
      }
      await transaction.vipAuditLog.create({ data: { action: "VIP_PROFILE_UPDATED", subjectId: client.id, details: { passwordChanged: Boolean(newPasswordValue) } } });
    });
    revalidatePath("/vip/dashboard");
    revalidatePath("/vip/dashboard/profile");
    return { success: true, message: "Your profile has been updated." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, message: "That WhatsApp number is already in use." };
    return { success: false, message: error instanceof Error ? error.message : "We could not update your profile." };
  }
}

async function requireVipAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required to manage VIP Private Rooms.");
  return admin;
}

function adminValue(data: FormData, key: string, label: string, maxLength: number, optional = false) {
  const raw = data.get(key);
  if (typeof raw !== "string") {
    if (optional && raw === null) return "";
    throw new Error(`${label} is invalid.`);
  }
  const value = raw.trim();
  if (!optional && !value) throw new Error(`${label} is required.`);
  if (value.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return value;
}

function addVipCalendarMonths(date: Date, count: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + count);
  const endOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, endOfMonth));
  return result;
}

function refreshVipViews() {
  revalidatePath("/dashboard");
  revalidatePath("/vip/dashboard");
  revalidatePath("/vip/dashboard/rooms");
  revalidatePath("/vip/dashboard/applications");
  revalidatePath("/vip/dashboard/membership");
  revalidatePath("/vip/dashboard/notifications");
}

export async function reviewVipApplication(data: FormData) {
  const admin = await requireVipAdmin();
  const id = adminValue(data, "id", "Application", 40);
  const decision = adminValue(data, "decision", "Review decision", 20);
  const feedback = adminValue(data, "feedback", "Feedback", 1000, true);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("The application reference is invalid.");
  if (!(["verify", "more-info", "reject"] as const).includes(decision as "verify" | "more-info" | "reject")) throw new Error("Choose a valid application decision.");
  const request = await prisma.privateRoomRequest.findUnique({
    where: { id },
    include: { payments: { where: { status: "VERIFIED" }, take: 1 }, customer: { select: { id: true } } },
  });
  if (!request || !unresolvedStatuses.includes(request.status)) throw new Error("This application is no longer awaiting review.");
  if (decision === "verify") {
    if (request.brokerOption === VipBrokerOption.OUR_BROKER && !request.depositProof && !request.proofReportedAt) {
      throw new Error("Record that the client sent broker deposit proof before verifying eligibility.");
    }
    if (request.brokerOption === VipBrokerOption.OWN_BROKER && !request.payments.length) {
      throw new Error("Verify the Own Broker payment before approving this application.");
    }
  }
  const nextStatus = decision === "verify"
    ? PrivateRoomRequestStatus.DEPOSIT_VERIFIED
    : decision === "more-info"
      ? PrivateRoomRequestStatus.MORE_INFO_REQUIRED
      : PrivateRoomRequestStatus.REJECTED;
  await prisma.$transaction(async (transaction) => {
    await transaction.privateRoomRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        adminFeedback: feedback || null,
        ...(decision === "verify" ? { depositVerifiedAt: new Date() } : {}),
      },
    });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: `VIP_APPLICATION_${decision.toUpperCase().replaceAll("-", "_")}`, subjectId: id, details: { feedback } } });
    await transaction.vipNotification.create({
      data: {
        customerId: request.customer.id,
        title: decision === "verify" ? "Application verified" : decision === "more-info" ? "More information needed" : "Application update",
        message: feedback || (decision === "verify" ? "Your eligibility has been verified. The team will activate your membership." : decision === "more-info" ? "The team needs additional information. Check your application history for details." : "The team has updated your application. Contact support if you have questions."),
      },
    });
  });
  refreshVipViews();
}

export async function activateVipMembership(data: FormData) {
  const admin = await requireVipAdmin();
  const id = adminValue(data, "id", "Application", 40);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("The application reference is invalid.");
  const settings = await vipSettings();
  const duration = Number(settings.membershipDurationMonths ?? "2");
  if (!Number.isInteger(duration) || duration < 2 || duration > 12) throw new Error("Membership duration settings must be between two and twelve calendar months.");
  await prisma.$transaction(async (transaction) => {
    const request = await transaction.privateRoomRequest.findUnique({
      where: { id },
      include: { payments: { where: { status: "VERIFIED" }, take: 1 } },
    });
    if (!request || request.status !== PrivateRoomRequestStatus.DEPOSIT_VERIFIED || !request.depositVerifiedAt) {
      throw new Error("Verify the application before activating a membership.");
    }
    if (request.brokerOption === VipBrokerOption.OWN_BROKER && !request.payments.length) {
      throw new Error("Verify the Own Broker payment before activation.");
    }
    const startsAt = new Date();
    const expiresAt = addVipCalendarMonths(startsAt, duration);
    await transaction.vipMembership.create({
      data: { customerId: request.customerId, applicationId: request.id, brokerOption: request.brokerOption, startsAt, expiresAt, activatedById: admin.id },
    });
    await transaction.privateRoomRequest.update({ where: { id }, data: { status: PrivateRoomRequestStatus.VIP_ACTIVE, vipGrantedAt: startsAt, vipExpiresAt: expiresAt } });
    await transaction.vipNotification.create({ data: { customerId: request.customerId, title: "VIP membership activated", message: `Your membership is active until ${expiresAt.toLocaleDateString("en-US", { dateStyle: "long" })}. Room access will appear in your VIP area after assignment.` } });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: "VIP_MEMBERSHIP_ACTIVATED", subjectId: request.id, details: { membershipStart: startsAt.toISOString(), membershipExpiry: expiresAt.toISOString(), durationMonths: duration } } });
  });
  refreshVipViews();
}

export async function updateVipMembership(data: FormData) {
  const admin = await requireVipAdmin();
  const id = adminValue(data, "id", "Membership", 40);
  const decision = adminValue(data, "decision", "Membership action", 20);
  if (!/^[A-Za-z0-9_-]+$/.test(id) || !["suspend", "reactivate", "extend"].includes(decision)) throw new Error("The membership action is invalid.");
  const membership = await prisma.vipMembership.findUnique({ where: { id } });
  if (!membership) throw new Error("This membership no longer exists.");
  let nextStatus = membership.status;
  let expiresAt = membership.expiresAt;
  if (decision === "suspend") {
    if (membership.status !== "ACTIVE" || membership.expiresAt <= new Date()) throw new Error("Only an active membership can be suspended.");
    nextStatus = "SUSPENDED";
  } else if (decision === "reactivate") {
    if (membership.status !== "SUSPENDED" || membership.expiresAt <= new Date()) throw new Error("Only a suspended, unexpired membership can be reactivated.");
    nextStatus = "ACTIVE";
  } else {
    const months = Number(adminValue(data, "months", "Extension", 2));
    if (!Number.isInteger(months) || months < 1 || months > 12) throw new Error("Choose an extension from one to twelve months.");
    if (!["ACTIVE", "SUSPENDED", "EXPIRED"].includes(membership.status)) throw new Error("Only an active, suspended, or expired membership can be extended.");
    expiresAt = addVipCalendarMonths(membership.expiresAt > new Date() ? membership.expiresAt : new Date(), months);
    if (membership.status === "EXPIRED" || membership.expiresAt <= new Date()) nextStatus = "ACTIVE";
  }
  await prisma.$transaction(async (transaction) => {
    await transaction.vipMembership.update({ where: { id }, data: { status: nextStatus, expiresAt } });
    await transaction.privateRoomRequest.update({
      where: { id: membership.applicationId },
      data: { status: nextStatus === "SUSPENDED" ? PrivateRoomRequestStatus.SUSPENDED : nextStatus === "EXPIRED" ? PrivateRoomRequestStatus.EXPIRED : PrivateRoomRequestStatus.VIP_ACTIVE, vipExpiresAt: expiresAt },
    });
    await transaction.vipNotification.create({
      data: { customerId: membership.customerId, title: decision === "suspend" ? "Membership suspended" : decision === "extend" ? "Membership extended" : "Membership reactivated", message: decision === "suspend" ? "Your room access is temporarily suspended. Contact support if you need help." : `Your membership is active through ${expiresAt.toLocaleDateString("en-US", { dateStyle: "long" })}.` },
    });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: `VIP_MEMBERSHIP_${decision.toUpperCase()}`, subjectId: id, details: { status: nextStatus, expiresAt: expiresAt.toISOString() } } });
  });
  refreshVipViews();
}

export async function saveVipRoom(data: FormData) {
  const admin = await requireVipAdmin();
  const id = adminValue(data, "id", "Room", 40, true);
  const slug = adminValue(data, "slug", "Room URL", 80).toLowerCase();
  const name = adminValue(data, "name", "Room name", 120);
  const category = adminValue(data, "category", "Category", 80);
  const description = adminValue(data, "description", "Description", 1000, true);
  const coverImage = adminValue(data, "coverImage", "Cover image", 1000, true);
  const isPublished = data.get("isPublished") === "on";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use lowercase letters, numbers, and hyphens for the room URL.");
  if (coverImage) {
    try { if (new URL(coverImage).protocol !== "https:") throw new Error(); } catch { throw new Error("Room cover images must use an HTTPS URL."); }
  }
  const saved = await prisma.vipRoom.upsert({
    where: { id: id || "__new__" },
    create: { slug, name, category, description, coverImage, isPublished },
    update: { slug, name, category, description, coverImage, isPublished },
    select: { id: true },
  });
  await prisma.vipAuditLog.create({ data: { actorId: admin.id, action: id ? "VIP_ROOM_UPDATED" : "VIP_ROOM_CREATED", subjectId: saved.id, details: { slug, isPublished } } });
  refreshVipViews();
}

export async function archiveVipRoom(data: FormData) {
  const admin = await requireVipAdmin();
  const id = adminValue(data, "id", "Room", 40);
  await prisma.$transaction(async (transaction) => {
    await transaction.vipRoom.update({ where: { id }, data: { isPublished: false } });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: "VIP_ROOM_ARCHIVED", subjectId: id } });
  });
  refreshVipViews();
}

export async function publishVipRoomPost(data: FormData) {
  const admin = await requireVipAdmin();
  const roomId = adminValue(data, "roomId", "Room", 40);
  const title = adminValue(data, "title", "Post title", 180);
  const body = adminValue(data, "body", "Post content", 20000);
  const isPinned = data.get("isPinned") === "on";
  const publish = data.get("publish") === "on";
  const uploadedFiles = data.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (uploadedFiles.length > 5) throw new Error("Attach no more than five images or PDFs to a post.");
  let totalBytes = 0;
  const attachments: Array<{ filename: string; mimeType: string; bytes: Uint8Array<ArrayBuffer> }> = [];
  for (const file of uploadedFiles) {
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 5_000_000) {
      throw new Error("Attachments must be JPG, PNG, WebP, or PDF files up to 5 MB each.");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    totalBytes += bytes.byteLength;
    const pdf = file.type === "application/pdf" && String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-";
    const png = file.type === "image/png" && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
    const jpeg = file.type === "image/jpeg" && bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = file.type === "image/webp" && bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
    if (!(pdf || png || jpeg || webp)) throw new Error("An attachment does not match its declared file type.");
    attachments.push({
      filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "room-attachment",
      mimeType: file.type,
      bytes,
    });
  }
  if (totalBytes > 5_000_000) throw new Error("All post attachments together must be 5 MB or smaller.");
  const room = await prisma.vipRoom.findUnique({ where: { id: roomId }, select: { id: true, isPublished: true } });
  if (!room?.isPublished) throw new Error("Publish the room before publishing content.");
  await prisma.$transaction(async (transaction) => {
    const post = await transaction.vipRoomPost.create({
      data: { roomId, title, body, isPinned, publishedAt: publish ? new Date() : null, attachments: { create: attachments } },
      select: { id: true },
    });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: publish ? "VIP_ROOM_POST_PUBLISHED" : "VIP_ROOM_POST_DRAFTED", subjectId: post.id, details: { roomId } } });
    if (publish) {
      const recipients = await transaction.vipRoomAssignment.findMany({
        where: { roomId, revokedAt: null, membership: { status: "ACTIVE", expiresAt: { gt: new Date() } } },
        select: { customerId: true },
        distinct: ["customerId"],
      });
      if (recipients.length) await transaction.vipNotification.createMany({ data: recipients.map(({ customerId }) => ({ customerId, title: "New room post", message: `New content is available in one of your VIP rooms: ${title}.` })) });
    }
  });
  refreshVipViews();
}

export async function getVipRoomAttachment(id: string) {
  const client = await getVipClient();
  if (!client || !/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new Error("This attachment is unavailable.");
  const attachment = await prisma.vipRoomAttachment.findFirst({
    where: {
      id,
      post: {
        publishedAt: { not: null },
        room: {
          isPublished: true,
          assignments: { some: { customerId: client.id, revokedAt: null, membership: { status: "ACTIVE", expiresAt: { gt: new Date() } } } },
        },
      },
    },
    select: { bytes: true, filename: true, mimeType: true },
  });
  if (!attachment) throw new Error("This attachment is unavailable.");
  return { bytes: Buffer.from(attachment.bytes).toString("base64"), filename: attachment.filename, mimeType: attachment.mimeType };
}

export async function assignVipRooms(data: FormData) {
  const admin = await requireVipAdmin();
  const membershipId = adminValue(data, "membershipId", "Membership", 40);
  const roomIds = [...new Set(data.getAll("roomIds").filter((value): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(value)))];
  await prisma.$transaction(async (transaction) => {
    const membership = await transaction.vipMembership.findUnique({ where: { id: membershipId } });
    if (!membership || membership.status !== "ACTIVE" || membership.expiresAt <= new Date()) throw new Error("Rooms can only be assigned to an active, unexpired membership.");
    const rooms = await transaction.vipRoom.findMany({ where: { id: { in: roomIds }, isPublished: true }, select: { id: true, name: true } });
    if (rooms.length !== roomIds.length) throw new Error("One or more selected rooms are unavailable.");
    const existing = await transaction.vipRoomAssignment.findMany({ where: { membershipId }, select: { id: true, roomId: true, revokedAt: true } });
    const selected = new Set(roomIds);
    for (const assignment of existing) {
      if (selected.has(assignment.roomId) && assignment.revokedAt) {
        await transaction.vipRoomAssignment.update({ where: { id: assignment.id }, data: { revokedAt: null, assignedAt: new Date() } });
      } else if (!selected.has(assignment.roomId) && !assignment.revokedAt) {
        await transaction.vipRoomAssignment.update({ where: { id: assignment.id }, data: { revokedAt: new Date() } });
      }
    }
    const knownRooms = new Set(existing.map(({ roomId }) => roomId));
    const newlyAssigned = rooms.filter(({ id }) => !knownRooms.has(id));
    if (newlyAssigned.length) await transaction.vipRoomAssignment.createMany({ data: newlyAssigned.map(({ id }) => ({ customerId: membership.customerId, membershipId, roomId: id })) });
    for (const room of rooms) await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: "VIP_ROOM_ASSIGNED", subjectId: membershipId, details: { roomId: room.id, customerId: membership.customerId } } });
    await transaction.vipNotification.create({ data: { customerId: membership.customerId, title: "VIP room access updated", message: "Your assigned VIP room access has been updated." } });
  });
  refreshVipViews();
}

export async function saveVipSettings(data: FormData) {
  const admin = await requireVipAdmin();
  const settings = {
    brokerName: adminValue(data, "brokerName", "Broker name", 120),
    brokerLogo: adminValue(data, "brokerLogo", "Broker logo", 1000, true),
    brokerReferralUrl: adminValue(data, "brokerReferralUrl", "Broker referral URL", 1000, true),
    depositRequirements: adminValue(data, "depositRequirements", "Deposit requirements", 2000),
    whatsappNumber: adminValue(data, "whatsappNumber", "WhatsApp number", 40),
    ownBrokerPrice: adminValue(data, "ownBrokerPrice", "Own Broker price", 20),
    ownBrokerCurrency: adminValue(data, "ownBrokerCurrency", "Currency", 3),
    ownBrokerPaymentInstructions: adminValue(data, "ownBrokerPaymentInstructions", "Payment instructions", 3000),
    membershipDurationMonths: adminValue(data, "membershipDurationMonths", "Membership duration", 2),
    supportEmail: adminValue(data, "supportEmail", "Support email", 254, true),
  };
  for (const key of ["brokerLogo", "brokerReferralUrl"] as const) {
    const value = settings[key];
    if (value) {
      try { if (new URL(value).protocol !== "https:") throw new Error(); } catch { throw new Error(`${key === "brokerLogo" ? "Broker logo" : "Referral link"} must use HTTPS.`); }
    }
  }
  if (!/^\+[1-9]\d{7,14}$/.test(settings.whatsappNumber.replace(/[\s().-]/g, ""))) throw new Error("Enter a WhatsApp number with country code.");
  const price = Number(settings.ownBrokerPrice);
  const duration = Number(settings.membershipDurationMonths);
  if (!Number.isFinite(price) || price <= 0 || price > 10000) throw new Error("The Own Broker price must be greater than zero.");
  if (!Number.isInteger(duration) || duration < 2 || duration > 12) throw new Error("Membership duration must be from two to twelve calendar months.");
  if (!/^[A-Z]{3}$/.test(settings.ownBrokerCurrency)) throw new Error("Use a three-letter currency code.");
  if (settings.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail)) throw new Error("Enter a valid support email.");
  await prisma.$transaction(async (transaction) => {
    for (const [key, value] of Object.entries(settings)) await transaction.vipPlatformSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
    await transaction.vipAuditLog.create({ data: { actorId: admin.id, action: "VIP_SETTINGS_UPDATED", details: { keys: Object.keys(settings) } } });
  });
  refreshVipViews();
}

export async function getPrivateRoomProof(id: string) {
  await requireVipAdmin();
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw new Error("This proof is unavailable.");
  const proof = await prisma.privateRoomRequest.findUnique({
    where: { id },
    select: { depositProof: true, depositProofMime: true, depositProofName: true },
  });
  if (!proof?.depositProof || !proof.depositProofMime) throw new Error("This proof is unavailable.");
  return {
    bytes: Buffer.from(proof.depositProof).toString("base64"),
    mime: proof.depositProofMime,
    filename: (proof.depositProofName ?? "deposit-proof").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120),
  };
}