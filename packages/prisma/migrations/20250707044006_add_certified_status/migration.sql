/*
  Warnings:

  - The `domain` column on the `TEST_threads` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TEST_CertificationStatus" AS ENUM ('PENDING', 'CERTIFIED', 'NOT_CERTIFIED');

-- AlterTable
ALTER TABLE "TEST_threads" ADD COLUMN     "is_certified" "TEST_CertificationStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "domain",
ADD COLUMN     "domain" "TEST_Domain" NOT NULL DEFAULT 'LEGAL';

-- CreateIndex
CREATE INDEX "TEST_threads_domain_idx" ON "TEST_threads"("domain");

-- CreateIndex
CREATE INDEX "TEST_threads_is_certified_idx" ON "TEST_threads"("is_certified");
