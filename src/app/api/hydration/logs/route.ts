import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

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
