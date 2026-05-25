import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary, normalizeHydrationDate } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isCurrentUtcDay(date: Date) {
  return normalizeHydrationDate(date).getTime() === normalizeHydrationDate(new Date()).getTime();
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLog = await prisma.hydrationLog.findUnique({
      where: {
        id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data: {
      cupsConsumed?: number;
      cupSize?: number;
      loggedAt?: Date;
    } = {};

    if (Object.prototype.hasOwnProperty.call(body, 'cupsConsumed')) {
      const cupsConsumed = parsePositiveInt(body.cupsConsumed);

      if (!cupsConsumed) {
        return NextResponse.json(
          { error: 'cupsConsumed must be valid' },
          { status: 400 }
        );
      }

      data.cupsConsumed = cupsConsumed;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'cupSize')) {
      const cupSize = parsePositiveInt(body.cupSize);

      if (!cupSize) {
        return NextResponse.json(
          { error: 'cupSize must be valid' },
          { status: 400 }
        );
      }

      data.cupSize = cupSize;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'loggedAt')) {
      const loggedAt = new Date(body.loggedAt);

      if (Number.isNaN(loggedAt.getTime())) {
        return NextResponse.json(
          { error: 'loggedAt must be valid' },
          { status: 400 }
        );
      }

      data.loggedAt = loggedAt;
    }

    const log = await prisma.hydrationLog.update({
      where: { id },
      data,
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

export const PUT = PATCH;

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLog = await prisma.hydrationLog.findUnique({
      where: {
        id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userId || !isCurrentUtcDay(existingLog.loggedAt)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.hydrationLog.delete({
      where: { id },
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
