-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PrivateServiceKind" AS ENUM ('OUTING', 'PRIVATE_VISIT', 'CHAUFFEUR');

-- CreateEnum
CREATE TYPE "TransferServiceType" AS ENUM ('AIRPORT_ROUTE', 'PRIVATE_SERVICE', 'CUSTOM_ROUTE');

-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TransferRoute" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateTransferService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "PrivateServiceKind" NOT NULL DEFAULT 'OUTING',
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "passengerLimit" INTEGER NOT NULL DEFAULT 8,
    "duration" TEXT NOT NULL DEFAULT 'À définir',
    "image" TEXT NOT NULL DEFAULT '',
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "sharedUrl" TEXT,
    "sharedPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateTransferService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "serviceType" "TransferServiceType" NOT NULL,
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'NEW',
    "serviceName" TEXT NOT NULL,
    "routeId" TEXT,
    "privateServiceId" TEXT,
    "departure" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "priceAtRequest" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "serviceTime" TEXT,
    "passengerCount" INTEGER NOT NULL,
    "luggageCount" INTEGER NOT NULL DEFAULT 0,
    "hotelAddress" TEXT,
    "flightNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferRoute_isActive_sortOrder_idx" ON "TransferRoute"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TransferRoute_from_to_key" ON "TransferRoute"("from", "to");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateTransferService_name_key" ON "PrivateTransferService"("name");

-- CreateIndex
CREATE INDEX "PrivateTransferService_isActive_sortOrder_idx" ON "PrivateTransferService"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TransferLocation_name_key" ON "TransferLocation"("name");

-- CreateIndex
CREATE INDEX "TransferLocation_isActive_sortOrder_idx" ON "TransferLocation"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "TransferRequest_status_createdAt_idx" ON "TransferRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TransferRequest_serviceDate_idx" ON "TransferRequest"("serviceDate");

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransferRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_privateServiceId_fkey" FOREIGN KEY ("privateServiceId") REFERENCES "PrivateTransferService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

