CREATE TYPE "FinancialTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'PROFIT', 'PROFIT_SHARE');
CREATE TYPE "FinancialTransactionStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'COMPLETED');

CREATE TABLE "FinancialTransaction" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "roomId" TEXT,
  "copyTradingApplicationId" TEXT,
  "createdById" TEXT,
  "reviewedById" TEXT,
  "type" "FinancialTransactionType" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" "FinancialTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "reference" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FinancialTransaction_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "FinancialTransaction_reference_key" ON "FinancialTransaction"("reference");
CREATE INDEX "FinancialTransaction_type_status_createdAt_idx" ON "FinancialTransaction"("type", "status", "createdAt");
CREATE INDEX "FinancialTransaction_customerId_type_createdAt_idx" ON "FinancialTransaction"("customerId", "type", "createdAt");
CREATE INDEX "FinancialTransaction_roomId_type_createdAt_idx" ON "FinancialTransaction"("roomId", "type", "createdAt");

ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VipRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_copyTradingApplicationId_fkey" FOREIGN KEY ("copyTradingApplicationId") REFERENCES "CopyTradingApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;