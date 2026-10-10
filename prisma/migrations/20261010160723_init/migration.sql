-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROVIDER', 'RECIPIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'PARTIALLY_RESERVED', 'FULLY_RESERVED', 'PICKUP_IN_PROGRESS', 'COLLECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('REQUESTED', 'RESERVED', 'PICKUP_IN_PROGRESS', 'COLLECTED', 'CANCELLED', 'NO_SHOW', 'EXPIRED');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('COOKED_MEALS', 'BAKERY', 'PACKAGED', 'PRODUCE', 'DAIRY', 'BEVERAGES', 'OTHER');

-- CreateEnum
CREATE TYPE "FoodUnit" AS ENUM ('PORTIONS', 'KG', 'PACKETS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_LISTING_NEARBY', 'CLAIM_SUCCESS', 'CLAIM_CANCELLED', 'PICKUP_REMINDER', 'LISTING_EXPIRED', 'COLLECTION_SUCCESS', 'PROVIDER_CANCELLATION', 'NEW_CLAIM', 'RECIPIENT_ARRIVED', 'QUANTITY_RESTORED', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organisationName" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodListing" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "FoodCategory" NOT NULL DEFAULT 'COOKED_MEALS',
    "totalQuantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "unit" "FoodUnit" NOT NULL DEFAULT 'PORTIONS',
    "preparedAt" TIMESTAMP(3) NOT NULL,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "pickupDeadline" TIMESTAMP(3) NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "image" TEXT,
    "allergenNotes" TEXT,
    "packagingType" TEXT,
    "notes" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'RESERVED',
    "claimToken" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "maximumQuantity" INTEGER NOT NULL DEFAULT 100,
    "availableFrom" TEXT,
    "availableUntil" TEXT,

    CONSTRAINT "RecipientPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "User"("verificationStatus");

-- CreateIndex
CREATE INDEX "FoodListing_pickupDeadline_idx" ON "FoodListing"("pickupDeadline");

-- CreateIndex
CREATE INDEX "FoodListing_status_idx" ON "FoodListing"("status");

-- CreateIndex
CREATE INDEX "FoodListing_providerId_idx" ON "FoodListing"("providerId");

-- CreateIndex
CREATE INDEX "FoodListing_latitude_longitude_idx" ON "FoodListing"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "FoodListing_status_pickupDeadline_idx" ON "FoodListing"("status", "pickupDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimToken_key" ON "Claim"("claimToken");

-- CreateIndex
CREATE INDEX "Claim_listingId_idx" ON "Claim"("listingId");

-- CreateIndex
CREATE INDEX "Claim_recipientId_idx" ON "Claim"("recipientId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_listingId_status_idx" ON "Claim"("listingId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecipientPreference_userId_key" ON "RecipientPreference"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "FoodListing" ADD CONSTRAINT "FoodListing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "FoodListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientPreference" ADD CONSTRAINT "RecipientPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
