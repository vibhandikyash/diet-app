import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { validateDailyTargetCups } from '@/lib/hydration-goal-validation';
import { prisma } from '@/lib/prisma';

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

function validationErrorResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function findCurrentGoal(userId: string) {
  return prisma.hydrationGoal.findFirst({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

// GET /api/hydration/goal - Get authenticated user's current hydration goal
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const goal = await findCurrentGoal(userId);

    if (!goal) {
      return NextResponse.json(
        { error: 'Hydration goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching hydration goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hydration goal' },
      { status: 500 }
    );
  }
}

// POST /api/hydration/goal - Create authenticated user's initial hydration goal
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validationError = validateDailyTargetCups(body.dailyTargetCups);

    if (validationError) {
      return validationErrorResponse(validationError.message);
    }

    const existingGoal = await findCurrentGoal(userId);

    if (existingGoal) {
      return NextResponse.json(
        { error: 'Hydration goal already exists' },
        { status: 409 }
      );
    }

    const goal = await prisma.hydrationGoal.create({
      data: {
        userId,
        dailyTargetCups: body.dailyTargetCups,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating hydration goal:', error);
    return NextResponse.json(
      { error: 'Failed to create hydration goal' },
      { status: 500 }
    );
  }
}

// PATCH /api/hydration/goal - Update authenticated user's current hydration goal
export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validationError = validateDailyTargetCups(body.dailyTargetCups);

    if (validationError) {
      return validationErrorResponse(validationError.message);
    }

    const existingGoal = await findCurrentGoal(userId);

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Hydration goal not found' },
        { status: 404 }
      );
    }

    const goal = await prisma.hydrationGoal.update({
      where: { id: existingGoal.id },
      data: {
        dailyTargetCups: body.dailyTargetCups,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating hydration goal:', error);
    return NextResponse.json(
      { error: 'Failed to update hydration goal' },
      { status: 500 }
    );
  }
}
