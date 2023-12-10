/*
  Warnings:

  - Added the required column `status` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Made the column `status` on table `companyApprovalLogs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "status" "CompanyApprovalStatusType" NOT NULL;

-- AlterTable
ALTER TABLE "companyApprovalLogs" ALTER COLUMN "status" SET NOT NULL;
