import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateFoodInput } from '@/lib/food-validation';

// GET /api/foods - List foods with pagination, search, and filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || '';

    // Build where clause for filtering
    const where: any = {};

    // Add search filter (case-insensitive name search)
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Add brand filter
    if (brand) {
      where.brand = brand;
    }

    const [foods, total] = await Promise.all([
      prisma.foodItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          nutrition: true,
        },
        orderBy: {
          name: 'asc', // Sort alphabetically by name
        },
      }),
      prisma.foodItem.count({ where }),
    ]);

    return NextResponse.json({
      foods,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching foods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    );
  }
}

// POST /api/foods - Create new food
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      servingSize,
      servingUnit,
      brand,
      calories,
      protein,
      carbs,
      fat,
    } = body;

    // Validate input
    const validationError = validateFoodInput({
      name,
      servingSize,
      servingUnit,
      brand,
      calories,
      protein,
      carbs,
      fat,
    });

    if (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Create food item with nutrition data
    const food = await prisma.foodItem.create({
      data: {
        name: name.trim(),
        servingSize: servingSize.toString(),
        servingUnit: servingUnit.trim(),
        brand: brand?.trim() || null,
        isCustom: true,
        nutrition: {
          create: {
            calories: parseInt(calories),
            protein: parseFloat(protein),
            carbs: parseFloat(carbs),
            fat: parseFloat(fat),
          },
        },
      },
      include: {
        nutrition: true,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error('Error creating food:', error);
    return NextResponse.json(
      { error: 'Failed to create food' },
      { status: 500 }
    );
  }
}
