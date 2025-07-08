-- AlterTable
ALTER TABLE "LinkedRepo" ADD COLUMN     "lastIndexError" TEXT,
ADD COLUMN     "lastIndexStatus" TEXT,
ADD COLUMN     "lastIndexTime" TIMESTAMP(3);
