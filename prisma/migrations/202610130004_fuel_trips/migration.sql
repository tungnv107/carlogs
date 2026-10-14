CREATE TYPE "EnergyUnit" AS ENUM ('LITER', 'KWH');

CREATE TABLE "FuelLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "unit" "EnergyUnit" NOT NULL,
    "quantity" DECIMAL(16,3) NOT NULL,
    "unitPrice" DECIMAL(18,3) NOT NULL,
    "isFullTank" BOOLEAN NOT NULL DEFAULT false,
    "vendor" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FuelLog_positive_quantity" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "odometer" >= 0)
);
CREATE UNIQUE INDEX "FuelLog_expenseId_key" ON "FuelLog"("expenseId");
CREATE INDEX "FuelLog_organizationId_vehicleId_occurredAt_idx" ON "FuelLog"("organizationId","vehicleId","occurredAt");
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TripLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "endedAt" TIMESTAMPTZ(3) NOT NULL,
    "odometerStart" INTEGER NOT NULL,
    "odometerEnd" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TripLog_distance_check" CHECK ("odometerStart" >= 0 AND "odometerEnd" >= "odometerStart" AND "distance" = "odometerEnd" - "odometerStart" AND "endedAt" > "startedAt")
);
CREATE INDEX "TripLog_organizationId_vehicleId_startedAt_idx" ON "TripLog"("organizationId","vehicleId","startedAt");
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "OdometerCorrection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "previousValue" INTEGER NOT NULL,
    "adjustedValue" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OdometerCorrection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OdometerCorrection_nonnegative_check" CHECK ("previousValue" >= 0 AND "adjustedValue" >= 0)
);
CREATE INDEX "OdometerCorrection_organizationId_vehicleId_createdAt_idx" ON "OdometerCorrection"("organizationId","vehicleId","createdAt");
ALTER TABLE "OdometerCorrection" ADD CONSTRAINT "OdometerCorrection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OdometerCorrection" ADD CONSTRAINT "OdometerCorrection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OdometerCorrection" ADD CONSTRAINT "OdometerCorrection_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
