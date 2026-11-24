ALTER TABLE "CopyTradingApplication"
ADD COLUMN "brokerLogin" TEXT,
ADD COLUMN "brokerPasswordEncrypted" TEXT,
ADD COLUMN "serverName" TEXT,
ADD COLUMN "serverIp" TEXT,
ADD COLUMN "internalNote" TEXT;
