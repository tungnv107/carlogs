CREATE TYPE "ReminderStatus" AS ENUM ('UPCOMING', 'DUE', 'OVERDUE', 'RESOLVED');

CREATE TABLE "MaintenanceRecord" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "expenseId" TEXT,
  "occurredAt" TIMESTAMPTZ(3) NOT NULL,
  "odometer" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "vendor" TEXT,
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceRecord_odometer_nonnegative" CHECK ("odometer" >= 0)
);
CREATE UNIQUE INDEX "MaintenanceRecord_expenseId_key" ON "MaintenanceRecord"("expenseId");
CREATE UNIQUE INDEX "MaintenanceRecord_organizationId_idempotencyKey_key" ON "MaintenanceRecord"("organizationId", "idempotencyKey");
CREATE INDEX "MaintenanceRecord_organizationId_vehicleId_occurredAt_idx" ON "MaintenanceRecord"("organizationId", "vehicleId", "occurredAt");
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MaintenanceSchedule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueDate" DATE,
  "dueOdometer" INTEGER,
  "warningDays" INTEGER NOT NULL DEFAULT 30,
  "warningKm" INTEGER NOT NULL DEFAULT 1000,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MaintenanceSchedule_threshold_check" CHECK (("dueDate" IS NOT NULL OR "dueOdometer" IS NOT NULL) AND ("dueOdometer" IS NULL OR "dueOdometer" >= 0) AND "warningDays" >= 0 AND "warningKm" >= 0)
);
CREATE INDEX "MaintenanceSchedule_organizationId_active_dueDate_idx" ON "MaintenanceSchedule"("organizationId", "active", "dueDate");
CREATE INDEX "MaintenanceSchedule_organizationId_vehicleId_dueOdometer_idx" ON "MaintenanceSchedule"("organizationId", "vehicleId", "dueOdometer");
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "VehicleDocument" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "documentNumber" TEXT,
  "effectiveAt" DATE,
  "expiresAt" DATE,
  "objectKey" TEXT,
  "originalName" TEXT,
  "mimeType" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VehicleDocument_objectKey_key" ON "VehicleDocument"("objectKey");
CREATE INDEX "VehicleDocument_organizationId_vehicleId_expiresAt_idx" ON "VehicleDocument"("organizationId", "vehicleId", "expiresAt");
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "ReminderStatus" NOT NULL,
  "dueDate" DATE,
  "dueOdometer" INTEGER,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Reminder_organizationId_sourceKey_key" ON "Reminder"("organizationId", "sourceKey");
CREATE INDEX "Reminder_organizationId_status_dueDate_idx" ON "Reminder"("organizationId", "status", "dueDate");
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
