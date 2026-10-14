CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'DRIVER', 'VIEWER');
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORBIKE', 'TRUCK', 'OTHER');
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'OTHER');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "ExpenseStatus" AS ENUM ('POSTED', 'VOID');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY, "name" TEXT, "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP(3), "image" TEXT,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "Account" (
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT, "access_token" TEXT, "expires_at" INTEGER,
  "token_type" TEXT, "scope" TEXT, "id_token" TEXT, "session_state" TEXT,
  PRIMARY KEY ("provider", "providerAccountId")
);
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE TABLE "Session" (
  "sessionToken" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL, "token" TEXT NOT NULL, "expires" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("identifier", "token")
);
CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL,
  "createdById" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "OrganizationMember" (
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY ("organizationId", "userId")
);
CREATE INDEX "OrganizationMember_userId_status_idx" ON "OrganizationMember"("userId", "status");
CREATE TABLE "Vehicle" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id"),
  "plate" TEXT NOT NULL, "name" TEXT NOT NULL, "type" "VehicleType" NOT NULL,
  "fuelType" "FuelType" NOT NULL, "brand" TEXT, "model" TEXT, "year" INTEGER,
  "color" TEXT, "odometer" INTEGER NOT NULL DEFAULT 0,
  "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE', "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_odometer_nonnegative" CHECK ("odometer" >= 0)
);
CREATE UNIQUE INDEX "Vehicle_organizationId_plate_key" ON "Vehicle"("organizationId", "plate");
CREATE INDEX "Vehicle_organizationId_status_idx" ON "Vehicle"("organizationId", "status");
CREATE TABLE "ExpenseCategory" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id"),
  "name" TEXT NOT NULL, "group" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE UNIQUE INDEX "ExpenseCategory_organizationId_name_key" ON "ExpenseCategory"("organizationId", "name");
CREATE TABLE "Expense" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id"),
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id"),
  "categoryId" TEXT NOT NULL REFERENCES "ExpenseCategory"("id"),
  "occurredAt" TIMESTAMPTZ(3) NOT NULL,
  "amount" DECIMAL(18,0) NOT NULL,
  "odometer" INTEGER, "vendor" TEXT, "description" TEXT, "paymentMethod" TEXT,
  "status" "ExpenseStatus" NOT NULL DEFAULT 'POSTED',
  "idempotencyKey" TEXT NOT NULL,
  "createdById" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Expense_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "Expense_odometer_nonnegative" CHECK ("odometer" IS NULL OR "odometer" >= 0)
);
CREATE UNIQUE INDEX "Expense_organizationId_idempotencyKey_key" ON "Expense"("organizationId", "idempotencyKey");
CREATE INDEX "Expense_organizationId_occurredAt_status_idx" ON "Expense"("organizationId", "occurredAt", "status");
CREATE INDEX "Expense_organizationId_vehicleId_occurredAt_idx" ON "Expense"("organizationId", "vehicleId", "occurredAt");
CREATE INDEX "Expense_organizationId_categoryId_occurredAt_idx" ON "Expense"("organizationId", "categoryId", "occurredAt");
CREATE TABLE "Attachment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "expenseId" TEXT NOT NULL REFERENCES "Expense"("id") ON DELETE CASCADE,
  "objectKey" TEXT NOT NULL UNIQUE,
  "originalName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_size_positive" CHECK ("size" > 0)
);
CREATE INDEX "Attachment_organizationId_expenseId_idx" ON "Attachment"("organizationId", "expenseId");
CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id"),
  "actorId" TEXT NOT NULL REFERENCES "User"("id"),
  "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "action" TEXT NOT NULL,
  "before" JSONB, "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuditLog_organizationId_entityType_entityId_idx" ON "AuditLog"("organizationId", "entityType", "entityId");
