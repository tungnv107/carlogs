ALTER TABLE "Vehicle"
  ADD COLUMN "assignedToId" TEXT,
  ADD COLUMN "imageObjectKey" TEXT,
  ADD COLUMN "imageMimeType" TEXT;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Vehicle_imageObjectKey_key" ON "Vehicle"("imageObjectKey");
CREATE INDEX "Vehicle_organizationId_assignedToId_idx" ON "Vehicle"("organizationId", "assignedToId");
