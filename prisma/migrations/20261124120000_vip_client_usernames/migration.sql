ALTER TABLE "TradingCustomerAccount" ADD COLUMN "username" TEXT;

UPDATE "TradingCustomerAccount" AS account
SET "username" = LOWER(customer."clientId")
FROM "TradingCustomer" AS customer
WHERE account."customerId" = customer."id";

ALTER TABLE "TradingCustomerAccount" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "TradingCustomerAccount_username_key" ON "TradingCustomerAccount"("username");