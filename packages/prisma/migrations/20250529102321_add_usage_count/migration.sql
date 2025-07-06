-- CreateTable
CREATE TABLE "UsageCount" (
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageCount_pkey" PRIMARY KEY ("userId","feature","year","month")
);
