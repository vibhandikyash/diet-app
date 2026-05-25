import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { validateHydrationLogInput } from '@/lib/hydration-log-validation';
import { prisma } from '@/lib/prisma';

function getDateRange(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const start = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) {
    return null;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

// GET /api/hydration/logs?date=YYYY-MM-DD - List hydration logs for one day
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'date query parameter is required' }, { status: 400 });
    }

    const range = getDateRange(date);

    if (!range) {
      return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const logs = await prisma.hydrationLog.findMany({
      where: {
        userId: session.user.id,
        loggedAt: {
          gte: range.start,
          lt: range.end,
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

// POST /api/hydration/logs - Create a hydration log with an auto-generated timestamp
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateHydrationLogInput(body, true);

    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { cupsConsumed, cupSize } = validation.data;

    if (cupsConsumed === undefined || cupSize === undefined) {
      return NextResponse.json({ error: 'cupsConsumed and cupSize are required' }, { status: 400 });
    }

    const log = await prisma.hydrationLog.create({
      data: {
        userId: session.user.id,
        cupsConsumed,
        cupSize,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to create hydration log' },
      { status: 500 }
    );
  }
}
