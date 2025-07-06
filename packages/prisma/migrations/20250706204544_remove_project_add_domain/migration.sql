/*
  Warnings:

  - You are about to drop the column `project_id` on the `TEST_threads` table. All the data in the column will be lost.
  - You are about to drop the `TEST_projects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TEST_projects" DROP CONSTRAINT "TEST_projects_user_id_fkey";

-- DropForeignKey
ALTER TABLE "TEST_threads" DROP CONSTRAINT "TEST_threads_project_id_fkey";

-- DropIndex
DROP INDEX "TEST_threads_project_id_idx";

-- AlterTable
ALTER TABLE "TEST_threads" DROP COLUMN "project_id",
ADD COLUMN     "domain" TEXT NOT NULL DEFAULT 'LEGAL';

-- DropTable
DROP TABLE "TEST_projects";

-- CreateIndex
CREATE INDEX "TEST_threads_domain_idx" ON "TEST_threads"("domain");
