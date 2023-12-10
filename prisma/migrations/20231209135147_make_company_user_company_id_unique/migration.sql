/*
  Warnings:

  - A unique constraint covering the columns `[companyId]` on the table `companyUsers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "companyUsers_companyId_key" ON "companyUsers"("companyId");
