import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { HydrationLog } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { validateHydrationLogInput } from '@/lib/hydration-log-validation';
import { prisma } from '@/lib/prisma';

function getCurrentDateRange() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

type AuthorizedHydrationLogResult =
  | { log: HydrationLog; response?: undefined }
  | { log?: undefined; response: NextResponse };

async function getAuthorizedHydrationLog(
  id: string,
  userId: string
): Promise<AuthorizedHydrationLogResult> {
  const log = await prisma.hydrationLog.findUnique({
    where: { id },
  });

  if (!log) {
    return { response: NextResponse.json({ error: 'Hydration log not found' }, { status: 404 }) };
  }

  if (log.userId !== userId) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { log };
}

// PATCH /api/hydration/logs/[id] - Update cups consumed or cup size
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { response } = await getAuthorizedHydrationLog(params.id, session.user.id);

    if (response) {
      return response;
    }

    const body = await request.json();
    const validation = validateHydrationLogInput(body);

    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const log = await prisma.hydrationLog.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error updating hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to update hydration log' },
      { status: 500 }
    );
  }
}

// DELETE /api/hydration/logs/[id] - Delete a current-day hydration log
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { log, response } = await getAuthorizedHydrationLog(params.id, session.user.id);

    if (response) {
      return response;
    }

    const currentDay = getCurrentDateRange();

    if (log.loggedAt < currentDay.start || log.loggedAt >= currentDay.end) {
      return NextResponse.json(
        { error: 'Only current-day hydration logs can be deleted' },
        { status: 403 }
      );
    }

    await prisma.hydrationLog.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Hydration log deleted successfully' });
  } catch (error) {
    console.error('Error deleting hydration log:', error);
    return NextResponse.json(
      { error: 'Failed to delete hydration log' },
      { status: 500 }
    );
  }
}
