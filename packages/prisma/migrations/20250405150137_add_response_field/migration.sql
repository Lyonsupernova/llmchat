-- CreateTable
CREATE TABLE "inputs" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inputs_pkey" PRIMARY KEY ("id")
);