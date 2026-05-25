import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary, normalizeHydrationDate } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLog = await prisma.hydrationLog.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    const body = await request.json();
    const cupsConsumed = parsePositiveInt(body.cupsConsumed);
    const cupSize = parsePositiveInt(body.cupSize);
    const loggedAt = body.loggedAt ? new Date(body.loggedAt) : existingLog.loggedAt;

    if (!cupsConsumed || !cupSize || Number.isNaN(loggedAt.getTime())) {
      return NextResponse.json(
        { error: 'cupsConsumed, cupSize, and loggedAt must be valid' },
        { status: 400 }
      );
    }

    const log = await prisma.hydrationLog.update({
      where: { id: params.id },
      data: {
        cupsConsumed,
        cupSize,
        loggedAt,
      },
    });

    const summary = await calculateDailyHydrationSummary(userId, log.loggedAt);
    const movedDays =
      normalizeHydrationDate(existingLog.loggedAt).getTime() !==
      normalizeHydrationDate(log.loggedAt).getTime();

    if (movedDays) {
      await calculateDailyHydrationSummary(userId, existingLog.loggedAt);
    }

    return NextResponse.json({ log, summary });
  } catch (error) {
    console.error('Error updating hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to update hydration log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLog = await prisma.hydrationLog.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    await prisma.hydrationLog.delete({
      where: { id: params.id },
    });

    const summary = await calculateDailyHydrationSummary(userId, existingLog.loggedAt);

    return NextResponse.json({ message: 'Hydration log deleted successfully', summary });
  } catch (error) {
    console.error('Error deleting hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to delete hydration log' },
      { status: 500 }
    );
  }
}
