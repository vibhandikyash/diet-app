import { prisma } from '@/lib/prisma';

type PrismaClientLike = typeof prisma;

export function normalizeHydrationDate(date: Date | string): Date {
  const parsed =
    typeof date === 'string' && !date.includes('T')
      ? new Date(`${date}T00:00:00.000Z`)
      : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid hydration date');
  }

  return new Date(Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate()
  ));
}

function nextUtcDay(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export async function calculateDailyHydrationSummary(
  userId: string,
  date: Date | string,
  client: PrismaClientLike = prisma
) {
  const summaryDate = normalizeHydrationDate(date);
  const dayEnd = nextUtcDay(summaryDate);

  const [logTotals, goal] = await Promise.all([
    client.hydrationLog.aggregate({
      where: {
        userId,
        loggedAt: {
          gte: summaryDate,
          lt: dayEnd,
        },
      },
      _sum: {
        cupsConsumed: true,
      },
    }),
    client.hydrationGoal.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const totalCups = logTotals._sum.cupsConsumed ?? 0;
  const goalAchieved = goal ? totalCups >= goal.dailyTargetCups : null;

  return client.dailyHydrationSummary.upsert({
    where: {
      userId_date: {
        userId,
        date: summaryDate,
      },
    },
    create: {
      userId,
      date: summaryDate,
      totalCups,
      goalAchieved,
    },
    update: {
      totalCups,
      goalAchieved,
    },
  });
}

export async function listDailyHydrationSummaries(
  userId: string,
  startDate: Date | string,
  endDate: Date | string,
  client: PrismaClientLike = prisma
) {
  const start = normalizeHydrationDate(startDate);
  const end = normalizeHydrationDate(endDate);

  if (start > end) {
    throw new Error('startDate must be before or equal to endDate');
  }

  return client.dailyHydrationSummary.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
}

export async function refreshSummaryForHydrationLog(
  logId: string,
  client: PrismaClientLike = prisma
) {
  const log = await client.hydrationLog.findUnique({
    where: { id: logId },
    select: {
      userId: true,
      loggedAt: true,
    },
  });

  if (!log) {
    return null;
  }

  return calculateDailyHydrationSummary(log.userId, log.loggedAt, client);
}
