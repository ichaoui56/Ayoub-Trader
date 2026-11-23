"use server";

import { FinancialTransactionStatus, FinancialTransactionType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";

function field(data: FormData, key: string, label: string, maxLength: number, optional = false) {
  const raw = data.get(key);
  if (typeof raw !== "string") {
    if (optional && raw === null) return "";
    throw new Error(`${label} is required.`);
  }
  const value = raw.trim();
  if (!value && !optional) throw new Error(`${label} is required.`);
  if (value.length > maxLength) throw new Error(`${label} is too long.`);
  return value;
}

async function requireAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return admin;
}

export async function createFinancialTransaction(formData: FormData) {
  const admin = await requireAdmin();
  const customerId = field(formData, "customerId", "Customer", 40);
  const typeValue = field(formData, "type", "Transaction type", 20);
  if (!Object.values(FinancialTransactionType).includes(typeValue as FinancialTransactionType)) throw new Error("Choose a valid transaction type.");
  const type = typeValue as FinancialTransactionType;
  if (type === FinancialTransactionType.PROFIT_SHARE) throw new Error("Profit shares must be created from a verified copy-trading profit record.");
  const amount = Number(field(formData, "amount", "Amount", 32));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) throw new Error("Enter a positive amount within the supported range.");
  const currency = field(formData, "currency", "Currency", 3);
  if (!(["USD", "EUR", "MAD"] as string[]).includes(currency)) throw new Error("Choose USD, EUR, or MAD.");
  const reference = field(formData, "reference", "Reference", 100, true) || null;
  const roomId = field(formData, "roomId", "Room", 40, true) || null;
  const notes = field(formData, "notes", "Notes", 500, true);
  const customer = await prisma.tradingCustomer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) throw new Error("The selected customer does not exist.");
  if (roomId) {
    const assignment = await prisma.vipRoomAssignment.findFirst({ where: { customerId, roomId, revokedAt: null, membership: { status: "ACTIVE", expiresAt: { gt: new Date() } } }, select: { id: true } });
    if (!assignment) throw new Error("Choose a room assigned to this customer with an active membership.");
  }

  try {
    await prisma.$transaction(async (database) => {
      const created = await database.financialTransaction.create({
        data: {
          customerId,
          roomId,
          createdById: admin.id,
          type,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          currency,
          status: type === FinancialTransactionType.PROFIT ? FinancialTransactionStatus.COMPLETED : FinancialTransactionStatus.PENDING,
          reference,
          notes,
        },
        select: { id: true },
      });
      await database.vipAuditLog.create({ data: { actorId: admin.id, action: "FINANCIAL_TRANSACTION_CREATED", subjectId: created.id, details: { type, amount: amount.toFixed(2), currency, reference } } });
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/${type.toLowerCase()}s`);
    revalidatePath("/app");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("That transaction reference is already in use.");
    throw error;
  }
}

export async function reviewFinancialTransaction(formData: FormData) {
  const admin = await requireAdmin();
  const id = field(formData, "id", "Transaction", 40);
  const decision = field(formData, "decision", "Review decision", 20);
  const status = decision === "verify"
    ? FinancialTransactionStatus.VERIFIED
    : decision === "complete"
      ? FinancialTransactionStatus.COMPLETED
      : decision === "reject"
        ? FinancialTransactionStatus.REJECTED
        : null;
  if (!status) throw new Error("Choose a valid review decision.");
  const transaction = await prisma.financialTransaction.findUnique({ where: { id }, select: { id: true, type: true, status: true, amount: true, currency: true } });
  if (!transaction || transaction.status !== FinancialTransactionStatus.PENDING) throw new Error("This transaction is no longer awaiting review.");
  if (transaction.type === FinancialTransactionType.PROFIT && status !== FinancialTransactionStatus.COMPLETED) throw new Error("Reported profit records cannot be verified or rejected as deposits.");
  await prisma.$transaction(async (database) => {
    await database.financialTransaction.update({ where: { id }, data: { status, reviewedById: admin.id } });
    await database.vipAuditLog.create({ data: { actorId: admin.id, action: "FINANCIAL_TRANSACTION_REVIEWED", subjectId: id, details: { from: transaction.status, to: status, type: transaction.type, amount: transaction.amount.toString(), currency: transaction.currency } } });
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath(`/dashboard/${transaction.type.toLowerCase()}s`);
  revalidatePath("/app");
}

export async function recordCopyTradingProfitShare(formData: FormData) {
  const admin = await requireAdmin();
  const applicationId = field(formData, "applicationId", "Copy trading application", 40);
  const grossProfit = Number(field(formData, "grossProfit", "Generated profit", 32));
  if (!Number.isFinite(grossProfit) || grossProfit <= 0 || grossProfit > 100_000_000) throw new Error("Enter a positive generated-profit amount.");
  const currency = field(formData, "currency", "Currency", 3);
  if (!(["USD", "EUR", "MAD"] as string[]).includes(currency)) throw new Error("Choose USD, EUR, or MAD.");
  const reference = field(formData, "reference", "Reference", 100);
  const application = await prisma.copyTradingApplication.findUnique({ where: { id: applicationId }, select: { id: true, customerId: true, status: true } });
  if (!application || application.status !== "ACTIVE") throw new Error("Only an active copy-trading account can record generated profit.");

  try {
    const share = Number((grossProfit * 0.5).toFixed(2));
    await prisma.$transaction(async (database) => {
      const reportedProfit = await database.financialTransaction.create({
        data: { customerId: application.customerId, copyTradingApplicationId: application.id, createdById: admin.id, type: FinancialTransactionType.PROFIT, amount: new Prisma.Decimal(grossProfit.toFixed(2)), currency, status: FinancialTransactionStatus.COMPLETED, reference: `${reference}-gross`, notes: "Admin-reported copy-trading profit; verify against broker statement." },
        select: { id: true },
      });
      const profitShare = await database.financialTransaction.create({
        data: { customerId: application.customerId, copyTradingApplicationId: application.id, createdById: admin.id, type: FinancialTransactionType.PROFIT_SHARE, amount: new Prisma.Decimal(share.toFixed(2)), currency, status: FinancialTransactionStatus.PENDING, reference: `${reference}-share`, notes: "50% of reported copy-trading profit; payment handled externally." },
        select: { id: true },
      });
      await database.vipAuditLog.create({ data: { actorId: admin.id, action: "COPY_TRADING_PROFIT_RECORDED", subjectId: application.id, details: { reportedProfitId: reportedProfit.id, profitShareId: profitShare.id, grossProfit: grossProfit.toFixed(2), profitShare: share.toFixed(2), currency, reference } } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("That profit reference has already been recorded.");
    throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profit-sharing");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/app/transactions");
}