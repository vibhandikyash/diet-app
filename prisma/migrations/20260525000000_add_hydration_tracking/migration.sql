-- CreateEnum
CREATE TYPE "HydrationUnit" AS ENUM ('CUPS', 'ML', 'OZ');

-- CreateTable
CREATE TABLE "HydrationGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyTargetMl" INTEGER NOT NULL,
    "unit" "HydrationUnit" NOT NULL DEFAULT 'ML',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredUnit" "HydrationUnit" NOT NULL DEFAULT 'ML',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HydrationGoal_userId_idx" ON "HydrationGoal"("userId");

-- CreateIndex
CREATE INDEX "WaterLog_userId_idx" ON "WaterLog"("userId");

-- CreateIndex
CREATE INDEX "WaterLog_loggedAt_idx" ON "WaterLog"("loggedAt");

-- CreateIndex
CREATE INDEX "WaterLog_userId_loggedAt_idx" ON "WaterLog"("userId", "loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HydrationPreference_userId_key" ON "HydrationPreference"("userId");

-- CreateIndex
CREATE INDEX "HydrationPreference_userId_idx" ON "HydrationPreference"("userId");

-- AddForeignKey
ALTER TABLE "HydrationGoal" ADD CONSTRAINT "HydrationGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaterLog" ADD CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydrationPreference" ADD CONSTRAINT "HydrationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
