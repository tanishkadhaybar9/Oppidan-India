-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PERIPHERAL', 'FURNITURE', 'NETWORKING', 'VEHICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'RETIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "AssetAssignmentStatus" AS ENUM ('ACTIVE', 'RETURNED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AssetCategory" NOT NULL DEFAULT 'LAPTOP',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DOUBLE PRECISION,
    "warrantyExpiry" TIMESTAMP(3),
    "warrantyDetails" TEXT,
    "vendor" TEXT,
    "condition" "AssetCondition" NOT NULL DEFAULT 'EXCELLENT',
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "companyId" TEXT NOT NULL,
    "assignedEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAssignment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" TIMESTAMP(3),
    "assignedById" TEXT,
    "returnedById" TEXT,
    "status" "AssetAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "conditionAtAssignment" "AssetCondition",
    "conditionAtReturn" "AssetCondition",
    "notes" TEXT,
    "returnNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "issueDescription" TEXT NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "reportedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedTechnician" TEXT,
    "vendor" TEXT,
    "cost" DOUBLE PRECISION,
    "resolutionNotes" TEXT,
    "completedDate" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_companyId_assetCode_key" ON "Asset"("companyId", "assetCode");
CREATE INDEX "Asset_companyId_idx" ON "Asset"("companyId");
CREATE INDEX "Asset_category_idx" ON "Asset"("category");
CREATE INDEX "Asset_status_idx" ON "Asset"("status");
CREATE INDEX "Asset_assignedEmployeeId_idx" ON "Asset"("assignedEmployeeId");
CREATE INDEX "Asset_serialNumber_idx" ON "Asset"("serialNumber");

-- CreateIndex
CREATE INDEX "AssetAssignment_companyId_idx" ON "AssetAssignment"("companyId");
CREATE INDEX "AssetAssignment_assetId_idx" ON "AssetAssignment"("assetId");
CREATE INDEX "AssetAssignment_employeeId_idx" ON "AssetAssignment"("employeeId");
CREATE INDEX "AssetAssignment_status_idx" ON "AssetAssignment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssetMaintenance_companyId_ticketNumber_key" ON "AssetMaintenance"("companyId", "ticketNumber");
CREATE INDEX "AssetMaintenance_companyId_idx" ON "AssetMaintenance"("companyId");
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId");
CREATE INDEX "AssetMaintenance_status_idx" ON "AssetMaintenance"("status");
CREATE INDEX "AssetMaintenance_priority_idx" ON "AssetMaintenance"("priority");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAssignment" ADD CONSTRAINT "AssetAssignment_returnedById_fkey" FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
