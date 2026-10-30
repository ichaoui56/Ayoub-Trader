CREATE TYPE "ActivityReservationStatus" AS ENUM ('NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "ActivityReservation" (
    "id" TEXT NOT NULL,
    "status" "ActivityReservationStatus" NOT NULL DEFAULT 'NEW',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "hotelAddress" TEXT,
    "notes" TEXT,
    "estimatedTotal" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "priceNeedsConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityReservationLine" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "activitySlug" TEXT NOT NULL,
    "activityTitle" TEXT NOT NULL,
    "activityLocation" TEXT NOT NULL,
    "rateLabel" TEXT NOT NULL,
    "rateUnit" TEXT NOT NULL,
    "rateBilling" TEXT NOT NULL,
    "ratePrice" DOUBLE PRECISION NOT NULL,
    "adults" INTEGER NOT NULL,
    "children" INTEGER NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "extras" JSONB NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ActivityReservationLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConfirmedActivitySlot" (
    "id" TEXT NOT NULL,
    "activitySlug" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT NOT NULL,
    "reservationLineId" TEXT NOT NULL,

    CONSTRAINT "ConfirmedActivitySlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityReservation_status_createdAt_idx"
    ON "ActivityReservation"("status", "createdAt");

CREATE INDEX "ActivityReservationLine_activitySlug_date_time_idx"
    ON "ActivityReservationLine"("activitySlug", "date", "time");

CREATE UNIQUE INDEX "ConfirmedActivitySlot_activitySlug_date_time_key"
    ON "ConfirmedActivitySlot"("activitySlug", "date", "time");

CREATE UNIQUE INDEX "ConfirmedActivitySlot_reservationLineId_key"
    ON "ConfirmedActivitySlot"("reservationLineId");

ALTER TABLE "ActivityReservationLine"
    ADD CONSTRAINT "ActivityReservationLine_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "ActivityReservation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConfirmedActivitySlot"
    ADD CONSTRAINT "ConfirmedActivitySlot_reservationLineId_fkey"
    FOREIGN KEY ("reservationLineId") REFERENCES "ActivityReservationLine"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
