ALTER TABLE "DailyHydrationSummary"
  ALTER COLUMN "goalAchieved" DROP DEFAULT,
  ALTER COLUMN "goalAchieved" DROP NOT NULL;
