-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('GreatDayAdmin', 'HRManager', 'User', 'Public');

-- CreateEnum
CREATE TYPE "CompanyApprovalStatusType" AS ENUM ('Pending', 'InProgress', 'Revise', 'Revised', 'Approved', 'Declined');

-- CreateEnum
CREATE TYPE "AttendanceApprovalStatusType" AS ENUM ('Pending', 'Rejected', 'Approved');

-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('ClockIn', 'ClockOut');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('WorkFromHome', 'WorkFromOffice');

-- CreateEnum
CREATE TYPE "WorkingHourType" AS ENUM ('EightToFive', 'NineToEight');

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "requestorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companyUsers" (
    "id" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "workingHour" "WorkingHourType" NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isPic" BOOLEAN NOT NULL DEFAULT false,
    "positionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companyUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companyUserPersonInCharges" (
    "id" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "companyUserPersonInChargeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companyUserPersonInCharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companyApprovalLogs" (
    "id" TEXT NOT NULL,
    "status" "CompanyApprovalStatusType",
    "files" JSONB NOT NULL DEFAULT '[]',
    "remark" TEXT,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companyApprovalLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "isLateClockIn" BOOLEAN NOT NULL DEFAULT false,
    "isLateClockOut" BOOLEAN NOT NULL DEFAULT false,
    "companyUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendanceApprovals" (
    "id" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "type" "AttendanceType" NOT NULL,
    "status" "AttendanceApprovalStatusType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendanceApprovals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyUsers" ADD CONSTRAINT "companyUsers_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyUsers" ADD CONSTRAINT "companyUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyUsers" ADD CONSTRAINT "companyUsers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyUserPersonInCharges" ADD CONSTRAINT "companyUserPersonInCharges_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "companyUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyUserPersonInCharges" ADD CONSTRAINT "companyUserPersonInCharges_companyUserPersonInChargeId_fkey" FOREIGN KEY ("companyUserPersonInChargeId") REFERENCES "companyUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyApprovalLogs" ADD CONSTRAINT "companyApprovalLogs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companyApprovalLogs" ADD CONSTRAINT "companyApprovalLogs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "companyUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendanceApprovals" ADD CONSTRAINT "attendanceApprovals_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "attendances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
