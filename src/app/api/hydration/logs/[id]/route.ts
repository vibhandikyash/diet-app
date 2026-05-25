import { NextResponse } from 'next/server';
import { getHydrationRequestUserId, parsePositiveInt } from '@/lib/hydration-api';
import { calculateDailyHydrationSummary, normalizeHydrationDate } from '@/lib/hydration-summary';
import { prisma } from '@/lib/prisma';

function isCurrentHydrationDay(date: Date): boolean {
  return normalizeHydrationDate(date).getTime() === normalizeHydrationDate(new Date()).getTime();
}

function buildHydrationLogUpdate(body: { cupsConsumed?: unknown; cupSize?: unknown }) {
  const data: { cupsConsumed?: number; cupSize?: number } = {};

  if (body.cupsConsumed !== undefined) {
    const cupsConsumed = parsePositiveInt(body.cupsConsumed);

    if (!cupsConsumed) {
      return { error: 'cupsConsumed must be valid' };
    }

    data.cupsConsumed = cupsConsumed;
  }

  if (body.cupSize !== undefined) {
    const cupSize = parsePositiveInt(body.cupSize);

    if (!cupSize) {
      return { error: 'cupSize must be valid' };
    }

    data.cupSize = cupSize;
  }

  if (Object.keys(data).length === 0) {
    return { error: 'cupsConsumed or cupSize is required' };
  }

  return { data };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getHydrationRequestUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingLog = await prisma.hydrationLog.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isCurrentHydrationDay(existingLog.loggedAt)) {
      return NextResponse.json({ error: 'Only current-day hydration logs can be edited' }, { status: 403 });
    }

    const update = buildHydrationLogUpdate(await request.json());

    if ('error' in update) {
      return NextResponse.json({ error: update.error }, { status: 400 });
    }

    const log = await prisma.hydrationLog.update({
      where: { id: params.id },
      data: update.data,
    });

    const summary = await calculateDailyHydrationSummary(userId, log.loggedAt);

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

    const existingLog = await prisma.hydrationLog.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: 'Hydration log not found' }, { status: 404 });
    }

    if (existingLog.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!isCurrentHydrationDay(existingLog.loggedAt)) {
      return NextResponse.json({ error: 'Only current-day hydration logs can be deleted' }, { status: 403 });
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
