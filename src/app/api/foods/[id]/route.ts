import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateFoodInput } from '@/lib/food-validation';

// GET /api/foods/[id] - Get single food
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const food = await prisma.foodItem.findUnique({
      where: { id: params.id },
      include: {
        nutrition: true,
      },
    });

    if (!food) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(food);
  } catch (error) {
    console.error('Error fetching food:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food' },
      { status: 500 }
    );
  }
}

// PUT /api/foods/[id] - Update food
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if food exists
    const existingFood = await prisma.foodItem.findUnique({
      where: { id: params.id },
    });

    if (!existingFood) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    // Update food item and nutrition data
    const food = await prisma.foodItem.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        servingSize: servingSize.toString(),
        servingUnit: servingUnit.trim(),
        brand: brand?.trim() || null,
        nutrition: {
          upsert: {
            create: {
              calories: parseInt(calories),
              protein: parseFloat(protein),
              carbs: parseFloat(carbs),
              fat: parseFloat(fat),
            },
            update: {
              calories: parseInt(calories),
              protein: parseFloat(protein),
              carbs: parseFloat(carbs),
              fat: parseFloat(fat),
            },
          },
        },
      },
      include: {
        nutrition: true,
      },
    });

    return NextResponse.json(food);
  } catch (error) {
    console.error('Error updating food:', error);
    return NextResponse.json(
      { error: 'Failed to update food' },
      { status: 500 }
    );
  }
}

// DELETE /api/foods/[id] - Delete food
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if food exists
    const existingFood = await prisma.foodItem.findUnique({
      where: { id: params.id },
    });

    if (!existingFood) {
      return NextResponse.json(
        { error: 'Food not found' },
        { status: 404 }
      );
    }

    // Delete food (nutrition data will cascade delete)
    await prisma.foodItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Error deleting food:', error);
    return NextResponse.json(
      { error: 'Failed to delete food' },
      { status: 500 }
    );
  }
}
