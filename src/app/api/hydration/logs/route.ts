import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary, normalizeHydrationDate } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

function nextUtcDay(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString();
    const dayStart = normalizeHydrationDate(date);
    const dayEnd = nextUtcDay(dayStart);

    const logs = await prisma.hydrationLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
      orderBy: {
        loggedAt: 'asc',
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching hydration logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hydration logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const cupsConsumed = parsePositiveInt(body.cupsConsumed);
    const cupSize = parsePositiveInt(body.cupSize);
    const loggedAt = body.loggedAt ? new Date(body.loggedAt) : new Date();

    if (!cupsConsumed || !cupSize || Number.isNaN(loggedAt.getTime())) {
      return NextResponse.json(
        { error: 'cupsConsumed, cupSize, and loggedAt must be valid' },
        { status: 400 }
      );
    }

    const log = await prisma.hydrationLog.create({
      data: {
        userId,
        cupsConsumed,
        cupSize,
        loggedAt,
      },
    });

    const summary = await calculateDailyHydrationSummary(userId, log.loggedAt);

    return NextResponse.json({ log, summary }, { status: 201 });
  } catch (error) {
    console.error('Error creating hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to create hydration log' },
      { status: 500 }
    );
  }
}
