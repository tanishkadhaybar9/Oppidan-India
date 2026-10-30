-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PROBATION', 'SUSPENDED', 'TERMINATED');

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_companyId_fkey";

-- DropIndex
DROP INDEX "Employee_email_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "designationId" TEXT,
ADD COLUMN     "employeeCode" TEXT NOT NULL,
ADD COLUMN     "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "supervisorId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentHistory" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Designation_companyId_idx" ON "Designation"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Designation_companyId_name_key" ON "Designation"("companyId", "name");

-- CreateIndex
CREATE INDEX "EmploymentHistory_employeeId_idx" ON "EmploymentHistory"("employeeId");

-- CreateIndex
CREATE INDEX "EmploymentHistory_companyId_idx" ON "EmploymentHistory"("companyId");

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_designationId_idx" ON "Employee"("designationId");

-- CreateIndex
CREATE INDEX "Employee_supervisorId_idx" ON "Employee"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_employeeCode_key" ON "Employee"("companyId", "employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_email_key" ON "Employee"("companyId", "email");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designation" ADD CONSTRAINT "Designation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
