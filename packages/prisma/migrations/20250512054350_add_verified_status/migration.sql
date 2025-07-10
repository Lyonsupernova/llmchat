/*
  Warnings:

  - Made the column `verified` on table `inputs` required. This step will fail if there are existing NULL values in that column.

*/
-- Add verified column to the Input table
ALTER TABLE "inputs"
ADD COLUMN "verified" BOOLEAN DEFAULT FALSE;