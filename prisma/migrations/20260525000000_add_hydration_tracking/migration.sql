-- CreateTable
CREATE TABLE "HydrationGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyTargetCups" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cupsConsumed" INTEGER NOT NULL,
    "cupSize" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyHydrationSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCups" INTEGER NOT NULL DEFAULT 0,
    "goalAchieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyHydrationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HydrationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultCupSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HydrationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HydrationGoal_userId_idx" ON "HydrationGoal"("userId");

-- CreateIndex
CREATE INDEX "HydrationLog_userId_idx" ON "HydrationLog"("userId");

-- CreateIndex
CREATE INDEX "HydrationLog_loggedAt_idx" ON "HydrationLog"("loggedAt");

-- CreateIndex
CREATE INDEX "HydrationLog_userId_loggedAt_idx" ON "HydrationLog"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "DailyHydrationSummary_userId_idx" ON "DailyHydrationSummary"("userId");

-- CreateIndex
CREATE INDEX "DailyHydrationSummary_date_idx" ON "DailyHydrationSummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHydrationSummary_userId_date_key" ON "DailyHydrationSummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HydrationPreferences_userId_key" ON "HydrationPreferences"("userId");

-- CreateIndex
CREATE INDEX "HydrationPreferences_userId_idx" ON "HydrationPreferences"("userId");

-- AddForeignKey
ALTER TABLE "HydrationGoal" ADD CONSTRAINT "HydrationGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydrationLog" ADD CONSTRAINT "HydrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyHydrationSummary" ADD CONSTRAINT "DailyHydrationSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HydrationPreferences" ADD CONSTRAINT "HydrationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
