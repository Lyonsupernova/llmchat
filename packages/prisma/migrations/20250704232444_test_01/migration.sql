/*
  Warnings:

  - The values [CIVIL_ENG] on the enum `Domain` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TEST_Role" AS ENUM ('USER', 'LAWYER', 'REALTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TEST_Domain" AS ENUM ('LEGAL', 'CIVIL_ENGINEERING', 'REAL_ESTATE');

-- CreateEnum
CREATE TYPE "TEST_ItemStatus" AS ENUM ('QUEUED', 'PENDING', 'COMPLETED', 'ERROR', 'ABORTED', 'HUMAN_REVIEW');

-- CreateEnum
CREATE TYPE "TEST_ChatMode" AS ENUM ('Pro', 'Deep', 'O4_Mini', 'GPT_4_1', 'GPT_4_1_Mini', 'GPT_4_1_Nano', 'GPT_4o_Mini', 'LLAMA_4_SCOUT', 'GEMINI_2_FLASH', 'DEEPSEEK_R1', 'CLAUDE_3_5_SONNET', 'CLAUDE_3_7_SONNET');

-- AlterEnum
BEGIN;
CREATE TYPE "Domain_new" AS ENUM ('LEGAL', 'CIVIL_ENGINEERING', 'REAL_ESTATE');
ALTER TABLE "inputs" ALTER COLUMN "domain" DROP DEFAULT;
ALTER TABLE "inputs" ALTER COLUMN "domain" TYPE "Domain_new" USING ("domain"::text::"Domain_new");
ALTER TYPE "Domain" RENAME TO "Domain_old";
ALTER TYPE "Domain_new" RENAME TO "Domain";
DROP TYPE "Domain_old";
ALTER TABLE "inputs" ALTER COLUMN "domain" SET DEFAULT 'LEGAL';
COMMIT;

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REALTOR';

-- AlterTable
ALTER TABLE "inputs" ADD COLUMN     "userId" TEXT;

-- DropTable
DROP TABLE "Feedback";

-- CreateTable
CREATE TABLE "TEST_threads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinned_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "project_id" TEXT,

    CONSTRAINT "TEST_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TEST_thread_items" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "thread_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "mode" TEXT NOT NULL,
    "status" TEXT,
    "error" TEXT,
    "image_attachment" TEXT,
    "tool_calls" JSONB,
    "tool_results" JSONB,
    "steps" JSONB,
    "answer" JSONB,
    "metadata" JSONB,
    "sources" JSONB,
    "suggestions" TEXT[],
    "object" JSONB,

    CONSTRAINT "TEST_thread_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TEST_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "TEST_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TEST_users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "TEST_Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TEST_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TEST_usage_counts" (
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TEST_usage_counts_pkey" PRIMARY KEY ("user_id","feature","year","month")
);

-- CreateTable
CREATE TABLE "TEST_feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TEST_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TEST_threads_user_id_created_at_idx" ON "TEST_threads"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "TEST_threads_pinned_pinned_at_idx" ON "TEST_threads"("pinned", "pinned_at");

-- CreateIndex
CREATE INDEX "TEST_threads_project_id_idx" ON "TEST_threads"("project_id");

-- CreateIndex
CREATE INDEX "TEST_thread_items_thread_id_created_at_idx" ON "TEST_thread_items"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "TEST_thread_items_parent_id_idx" ON "TEST_thread_items"("parent_id");

-- CreateIndex
CREATE INDEX "TEST_thread_items_status_idx" ON "TEST_thread_items"("status");

-- CreateIndex
CREATE INDEX "TEST_projects_user_id_created_at_idx" ON "TEST_projects"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "TEST_users_email_key" ON "TEST_users"("email");

-- AddForeignKey
ALTER TABLE "inputs" ADD CONSTRAINT "inputs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_threads" ADD CONSTRAINT "TEST_threads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TEST_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_threads" ADD CONSTRAINT "TEST_threads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "TEST_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_thread_items" ADD CONSTRAINT "TEST_thread_items_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "TEST_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_thread_items" ADD CONSTRAINT "TEST_thread_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "TEST_thread_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_projects" ADD CONSTRAINT "TEST_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TEST_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_usage_counts" ADD CONSTRAINT "TEST_usage_counts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TEST_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TEST_feedbacks" ADD CONSTRAINT "TEST_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "TEST_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
