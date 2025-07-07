/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `LinkedRepo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LinkedRepo_userId_key" ON "LinkedRepo"("userId");
