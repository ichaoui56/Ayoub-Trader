ALTER TABLE "PrivateTransferService"
ADD COLUMN "startTimes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "PrivateTransferService"
DROP COLUMN "sharedUrl",
DROP COLUMN "sharedPrice";
