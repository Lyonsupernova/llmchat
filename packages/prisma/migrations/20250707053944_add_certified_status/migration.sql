-- CreateEnum
CREATE TYPE "TEST_CertifiedStatus" AS ENUM ('PENDING', 'CERTIFIED', 'NOT_CERTIFIED');

-- AlterTable
ALTER TABLE "TEST_threads" ADD COLUMN     "certified_status" "TEST_CertifiedStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "TEST_threads_certified_status_idx" ON "TEST_threads"("certified_status");
