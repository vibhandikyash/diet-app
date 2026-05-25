import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date is required' }, { status: 400 });
    }

    const dayStart = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(dayStart.getTime())) {
      return NextResponse.json({ error: 'date must be valid' }, { status: 400 });
    }

    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
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
