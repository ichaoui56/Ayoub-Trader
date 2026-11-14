CREATE TYPE "PrivateRoomRequestStatus" AS ENUM ('SUBMITTED', 'DEPOSIT_VERIFIED', 'VIP_ACTIVE', 'REJECTED', 'EXPIRED');
CREATE TYPE "CopyTradingStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'AUTHORIZATION_PENDING', 'AUTHORIZED', 'ACTIVE', 'PAUSED', 'REJECTED');
CREATE TYPE "CoachingPackage" AS ENUM ('STARTER', 'ADVANCED', 'PREMIUM');
CREATE TYPE "CoachingBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "CoachingSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE "ManualPaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "ManualPaymentService" AS ENUM ('PRIVATE_ROOM', 'COPY_TRADING', 'COACHING');
CREATE TYPE "CoachingSlotKind" AS ENUM ('RESERVED', 'BLOCKED');

CREATE TABLE "TradingCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TradingCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrivateRoomRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "PrivateRoomRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "depositProof" BYTEA,
    "depositProofMime" TEXT,
    "depositProofName" TEXT,
    "depositVerifiedAt" TIMESTAMP(3),
    "vipGrantedAt" TIMESTAMP(3),
    "vipExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PrivateRoomRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrivateRoomRequest_depositProof_check" CHECK (
      ("depositProof" IS NULL AND "depositProofMime" IS NULL AND "depositProofName" IS NULL) OR
      ("depositProof" IS NOT NULL AND "depositProofMime" IN ('image/jpeg', 'image/png', 'image/webp') AND "depositProofName" IS NOT NULL)
    )
);

CREATE TABLE "CopyTradingApplication" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "accountBalance" DECIMAL(12,2) NOT NULL,
    "status" "CopyTradingStatus" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CopyTradingApplication_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CopyTradingApplication_balance_check" CHECK ("accountBalance" >= 200)
);

CREATE TABLE "CoachingBooking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "package" "CoachingPackage" NOT NULL,
    "status" "CoachingBookingStatus" NOT NULL DEFAULT 'PENDING',
    "priceDh" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "dailyStartMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "expectedSessions" INTEGER NOT NULL,
    "remainingSessions" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachingBooking_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoachingBooking_date_check" CHECK ("startDate" < "endDate"),
    CONSTRAINT "CoachingBooking_duration_check" CHECK (
      ("package" = 'STARTER' AND "priceDh" = 1500 AND "durationMinutes" = 60) OR
      ("package" = 'ADVANCED' AND "priceDh" = 2500 AND "durationMinutes" = 120) OR
      ("package" = 'PREMIUM' AND "priceDh" = 5000 AND "durationMinutes" = 180)
    ),
    CONSTRAINT "CoachingBooking_sessions_check" CHECK (
      "expectedSessions" > 0 AND "remainingSessions" >= 0 AND "remainingSessions" <= "expectedSessions"
    ),
    CONSTRAINT "CoachingBooking_start_check" CHECK (
      "dailyStartMinute" >= 0 AND "dailyStartMinute" < 1440 AND "dailyStartMinute" % 15 = 0 AND
      "dailyStartMinute" + "durationMinutes" <= 1440
    )
);

CREATE TABLE "CoachingSession" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "CoachingSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachingSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoachingSession_time_check" CHECK (
      "startMinute" >= 0 AND "startMinute" < 1440 AND "startMinute" % 15 = 0 AND
      "durationMinutes" IN (60, 120, 180) AND "startMinute" + "durationMinutes" <= 1440
    )
);

CREATE TABLE "CoachingAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachingAvailabilityBlock_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoachingAvailabilityBlock_time_check" CHECK (
      "startMinute" >= 0 AND "startMinute" < "endMinute" AND "endMinute" <= 1440 AND
      "startMinute" % 15 = 0 AND "endMinute" % 15 = 0
    )
);

CREATE TABLE "CoachingTimeSlot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quarter" INTEGER NOT NULL,
    "kind" "CoachingSlotKind" NOT NULL,
    "sessionId" TEXT,
    "blockId" TEXT,
    CONSTRAINT "CoachingTimeSlot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CoachingTimeSlot_quarter_check" CHECK ("quarter" >= 0 AND "quarter" < 96),
    CONSTRAINT "CoachingTimeSlot_owner_check" CHECK (
      ("kind" = 'RESERVED' AND "sessionId" IS NOT NULL AND "blockId" IS NULL) OR
      ("kind" = 'BLOCKED' AND "sessionId" IS NULL AND "blockId" IS NOT NULL)
    )
);

CREATE TABLE "ManualPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "service" "ManualPaymentService" NOT NULL,
    "privateRoomRequestId" TEXT,
    "copyTradingApplicationId" TEXT,
    "coachingBookingId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT NOT NULL DEFAULT '',
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ManualPayment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ManualPayment_amount_check" CHECK ("amount" >= 0),
    CONSTRAINT "ManualPayment_service_check" CHECK (
      ("service" = 'PRIVATE_ROOM' AND "privateRoomRequestId" IS NOT NULL AND "copyTradingApplicationId" IS NULL AND "coachingBookingId" IS NULL) OR
      ("service" = 'COPY_TRADING' AND "privateRoomRequestId" IS NULL AND "copyTradingApplicationId" IS NOT NULL AND "coachingBookingId" IS NULL) OR
      ("service" = 'COACHING' AND "privateRoomRequestId" IS NULL AND "copyTradingApplicationId" IS NULL AND "coachingBookingId" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "TradingCustomer_phone_key" ON "TradingCustomer"("phone");
CREATE INDEX "TradingCustomer_name_idx" ON "TradingCustomer"("name");
CREATE INDEX "PrivateRoomRequest_status_createdAt_idx" ON "PrivateRoomRequest"("status", "createdAt");
CREATE INDEX "PrivateRoomRequest_customerId_createdAt_idx" ON "PrivateRoomRequest"("customerId", "createdAt");
CREATE INDEX "CopyTradingApplication_status_createdAt_idx" ON "CopyTradingApplication"("status", "createdAt");
CREATE INDEX "CopyTradingApplication_customerId_createdAt_idx" ON "CopyTradingApplication"("customerId", "createdAt");
CREATE INDEX "CoachingBooking_status_createdAt_idx" ON "CoachingBooking"("status", "createdAt");
CREATE INDEX "CoachingBooking_customerId_createdAt_idx" ON "CoachingBooking"("customerId", "createdAt");
CREATE INDEX "CoachingBooking_startDate_endDate_idx" ON "CoachingBooking"("startDate", "endDate");
CREATE UNIQUE INDEX "CoachingSession_bookingId_date_key" ON "CoachingSession"("bookingId", "date");
CREATE INDEX "CoachingSession_date_startMinute_idx" ON "CoachingSession"("date", "startMinute");
CREATE INDEX "CoachingSession_status_date_idx" ON "CoachingSession"("status", "date");
CREATE INDEX "CoachingAvailabilityBlock_date_startMinute_idx" ON "CoachingAvailabilityBlock"("date", "startMinute");
CREATE UNIQUE INDEX "CoachingTimeSlot_date_quarter_key" ON "CoachingTimeSlot"("date", "quarter");
CREATE INDEX "CoachingTimeSlot_sessionId_idx" ON "CoachingTimeSlot"("sessionId");
CREATE INDEX "CoachingTimeSlot_blockId_idx" ON "CoachingTimeSlot"("blockId");
CREATE INDEX "ManualPayment_status_createdAt_idx" ON "ManualPayment"("status", "createdAt");
CREATE INDEX "ManualPayment_customerId_createdAt_idx" ON "ManualPayment"("customerId", "createdAt");
CREATE INDEX "ManualPayment_copyTradingApplicationId_idx" ON "ManualPayment"("copyTradingApplicationId");
CREATE INDEX "ManualPayment_service_status_idx" ON "ManualPayment"("service", "status");

ALTER TABLE "PrivateRoomRequest"
  ADD CONSTRAINT "PrivateRoomRequest_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CopyTradingApplication"
  ADD CONSTRAINT "CopyTradingApplication_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoachingBooking"
  ADD CONSTRAINT "CoachingBooking_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CoachingSession"
  ADD CONSTRAINT "CoachingSession_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "CoachingBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachingTimeSlot"
  ADD CONSTRAINT "CoachingTimeSlot_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "CoachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachingTimeSlot"
  ADD CONSTRAINT "CoachingTimeSlot_blockId_fkey"
  FOREIGN KEY ("blockId") REFERENCES "CoachingAvailabilityBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualPayment"
  ADD CONSTRAINT "ManualPayment_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "TradingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ManualPayment"
  ADD CONSTRAINT "ManualPayment_privateRoomRequestId_fkey"
  FOREIGN KEY ("privateRoomRequestId") REFERENCES "PrivateRoomRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualPayment"
  ADD CONSTRAINT "ManualPayment_copyTradingApplicationId_fkey"
  FOREIGN KEY ("copyTradingApplicationId") REFERENCES "CopyTradingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualPayment"
  ADD CONSTRAINT "ManualPayment_coachingBookingId_fkey"
  FOREIGN KEY ("coachingBookingId") REFERENCES "CoachingBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManualPayment"
  ADD CONSTRAINT "ManualPayment_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;