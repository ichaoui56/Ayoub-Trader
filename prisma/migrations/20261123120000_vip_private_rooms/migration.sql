CREATE TYPE "VipBrokerOption" AS ENUM ('OUR_BROKER', 'OWN_BROKER');
CREATE TYPE "VipMembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'ENDED');
ALTER TYPE "PrivateRoomRequestStatus" ADD VALUE 'PROOF_REPORTED';
ALTER TYPE "PrivateRoomRequestStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "PrivateRoomRequestStatus" ADD VALUE 'MORE_INFO_REQUIRED';
ALTER TYPE "PrivateRoomRequestStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "PrivateRoomRequestStatus" ADD VALUE 'SUSPENDED';

ALTER TABLE "TradingCustomer" ADD COLUMN "clientId" TEXT;
UPDATE "TradingCustomer"
SET "clientId" = 'VIP-' || TO_CHAR("createdAt", 'YYYY') || '-' || REPLACE(GEN_RANDOM_UUID()::TEXT, '-', '')
WHERE "clientId" IS NULL;
ALTER TABLE "TradingCustomer" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "TradingCustomer" ALTER COLUMN "clientId" SET DEFAULT ('VIP-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || REPLACE(GEN_RANDOM_UUID()::TEXT, '-', ''));
CREATE UNIQUE INDEX "TradingCustomer_clientId_key" ON "TradingCustomer"("clientId");

ALTER TABLE "PrivateRoomRequest"
  ADD COLUMN "brokerOption" "VipBrokerOption" NOT NULL DEFAULT 'OUR_BROKER',
  ADD COLUMN "proofReportedAt" TIMESTAMP(3),
  ADD COLUMN "adminFeedback" TEXT;

CREATE TABLE "TradingCustomerAccount" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "emailVerifiedAt" TIMESTAMP(3),
  "verificationTokenHash" TEXT,
  "verificationExpiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TradingCustomerAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TradingCustomerAccount_failedLoginCount_check" CHECK ("failedLoginCount" >= 0)
);

CREATE TABLE "VipMembership" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "brokerOption" "VipBrokerOption" NOT NULL,
  "status" "VipMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "activatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VipMembership_dates_check" CHECK ("startsAt" < "expiresAt")
);

INSERT INTO "VipMembership" ("id", "customerId", "applicationId", "brokerOption", "status", "startsAt", "expiresAt", "createdAt", "updatedAt")
SELECT
  'vip-legacy-' || request."id",
  request."customerId",
  request."id",
  'OUR_BROKER'::"VipBrokerOption",
  CASE WHEN request."vipExpiresAt" <= CURRENT_TIMESTAMP THEN 'EXPIRED'::"VipMembershipStatus" ELSE 'ACTIVE'::"VipMembershipStatus" END,
  request."vipGrantedAt",
  request."vipExpiresAt",
  request."createdAt",
  CURRENT_TIMESTAMP
FROM "PrivateRoomRequest" AS request
WHERE request."vipGrantedAt" IS NOT NULL
  AND request."vipExpiresAt" IS NOT NULL
  AND request."status" IN ('VIP_ACTIVE', 'EXPIRED');

CREATE TABLE "VipRoom" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT 'General',
  "coverImage" TEXT NOT NULL DEFAULT '',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipRoomAssignment" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "VipRoomAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipRoomPost" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipRoomPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipRoomAttachment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VipRoomAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipNotification" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VipNotification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VipPlatformSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VipPlatformSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "VipAuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "subjectId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VipAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TradingCustomerAccount_customerId_key" ON "TradingCustomerAccount"("customerId");
CREATE UNIQUE INDEX "TradingCustomerAccount_email_key" ON "TradingCustomerAccount"("email");
CREATE INDEX "TradingCustomerAccount_emailVerifiedAt_idx" ON "TradingCustomerAccount"("emailVerifiedAt");
CREATE UNIQUE INDEX "VipMembership_applicationId_key" ON "VipMembership"("applicationId");
CREATE INDEX "VipMembership_customerId_status_expiresAt_idx" ON "VipMembership"("customerId", "status", "expiresAt");
CREATE INDEX "VipMembership_status_expiresAt_idx" ON "VipMembership"("status", "expiresAt");
CREATE UNIQUE INDEX "VipRoom_slug_key" ON "VipRoom"("slug");
CREATE INDEX "VipRoom_isPublished_category_idx" ON "VipRoom"("isPublished", "category");
CREATE UNIQUE INDEX "VipRoomAssignment_membershipId_roomId_key" ON "VipRoomAssignment"("membershipId", "roomId");
CREATE INDEX "VipRoomAssignment_customerId_revokedAt_idx" ON "VipRoomAssignment"("customerId", "revokedAt");
CREATE INDEX "VipRoomAssignment_roomId_revokedAt_idx" ON "VipRoomAssignment"("roomId", "revokedAt");
CREATE INDEX "VipRoomPost_roomId_publishedAt_isPinned_idx" ON "VipRoomPost"("roomId", "publishedAt", "isPinned");
CREATE INDEX "VipRoomAttachment_postId_idx" ON "VipRoomAttachment"("postId");
CREATE INDEX "VipNotification_customerId_readAt_createdAt_idx" ON "VipNotification"("customerId", "readAt", "createdAt");
CREATE INDEX "VipAuditLog_action_createdAt_idx" ON "VipAuditLog"("action", "createdAt");
CREATE INDEX "VipAuditLog_subjectId_createdAt_idx" ON "VipAuditLog"("subjectId", "createdAt");

ALTER TABLE "TradingCustomerAccount" ADD CONSTRAINT "TradingCustomerAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PrivateRoomRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipMembership" ADD CONSTRAINT "VipMembership_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VipRoomAssignment" ADD CONSTRAINT "VipRoomAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipRoomAssignment" ADD CONSTRAINT "VipRoomAssignment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "VipMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipRoomAssignment" ADD CONSTRAINT "VipRoomAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VipRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VipRoomPost" ADD CONSTRAINT "VipRoomPost_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "VipRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VipRoomAttachment" ADD CONSTRAINT "VipRoomAttachment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "VipRoomPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VipNotification" ADD CONSTRAINT "VipNotification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VipAuditLog" ADD CONSTRAINT "VipAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
