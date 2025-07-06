-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('LEGAL', 'CIVIL_ENG');

-- AlterTable
ALTER TABLE "inputs" ADD COLUMN     "domain" "Domain" NOT NULL DEFAULT 'LEGAL';
