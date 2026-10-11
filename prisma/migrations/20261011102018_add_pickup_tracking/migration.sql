-- CreateEnum
CREATE TYPE "TrackingStatus" AS ENUM ('ACTIVE', 'ARRIVED', 'STOPPED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TRACKING_STARTED';
ALTER TYPE "NotificationType" ADD VALUE 'TRACKING_ARRIVED';
ALTER TYPE "NotificationType" ADD VALUE 'TRACKING_DELAYED';
ALTER TYPE "NotificationType" ADD VALUE 'TRACKING_STALE';
ALTER TYPE "NotificationType" ADD VALUE 'TRACKING_STOPPED';

-- CreateTable
CREATE TABLE "PickupTrackingSession" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "status" "TrackingStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "accuracyMeters" DOUBLE PRECISION,
    "headingDegrees" DOUBLE PRECISION,
    "speedMps" DOUBLE PRECISION,
    "lastLocationAt" TIMESTAMP(3),
    "clientTimestamp" TIMESTAMP(3),
    "routeAvailable" BOOLEAN NOT NULL DEFAULT false,
    "routeDistanceMeters" DOUBLE PRECISION,
    "routeDurationSeconds" DOUBLE PRECISION,
    "routeGeometry" JSONB,
    "consecutiveArrivalFixes" INTEGER NOT NULL DEFAULT 0,
    "arrivalDetectedAt" TIMESTAMP(3),
    "arrivalAlertSentAt" TIMESTAMP(3),
    "delayAlertSentAt" TIMESTAMP(3),
    "staleAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupTrackingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PickupTrackingSession_claimId_key" ON "PickupTrackingSession"("claimId");

-- CreateIndex
CREATE INDEX "PickupTrackingSession_status_idx" ON "PickupTrackingSession"("status");

-- CreateIndex
CREATE INDEX "PickupTrackingSession_status_lastLocationAt_idx" ON "PickupTrackingSession"("status", "lastLocationAt");

-- AddForeignKey
ALTER TABLE "PickupTrackingSession" ADD CONSTRAINT "PickupTrackingSession_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
