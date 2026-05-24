import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/meals - Create a new meal with food items
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, mealType, date, foodItems, notes } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Meal name is required' },
        { status: 400 }
      );
    }

    if (!mealType) {
      return NextResponse.json(
        { error: 'Meal type is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one food item is required' },
        { status: 400 }
      );
    }

    // Validate food items
    for (const item of foodItems) {
      if (!item.foodItemId) {
        return NextResponse.json(
          { error: 'Food item ID is required for all items' },
          { status: 400 }
        );
      }

      if (item.quantity === undefined || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be a positive number' },
          { status: 400 }
        );
      }
    }

    // Create meal with food items in a transaction
    const meal = await prisma.meal.create({
      data: {
        userId,
        name: name.trim(),
        mealType,
        date: new Date(date),
        notes: notes?.trim() || null,
        foodItems: {
          create: foodItems.map((item: any) => ({
            foodItemId: item.foodItemId,
            quantity: parseFloat(item.quantity),
            servingSize: item.servingSize || 'serving',
          })),
        },
      },
      include: {
        foodItems: {
          include: {
            foodItem: {
              include: {
                nutrition: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(meal, { status: 201 });
  } catch (error) {
    console.error('Error creating meal:', error);
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    );
  }
}

// GET /api/meals - List meals with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          foodItems: {
            include: {
              foodItem: {
                include: {
                  nutrition: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.meal.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      meals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    );
  }
}
