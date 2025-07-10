/*
  Warnings:

  - You are about to drop the column `is_certified` on the `TEST_threads` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "TEST_threads_is_certified_idx";

-- AlterTable
ALTER TABLE "TEST_threads" DROP COLUMN "is_certified";

-- DropEnum
DROP TYPE "TEST_CertificationStatus";
