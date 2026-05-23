/**
 * Example database queries using Prisma Client
 * These examples demonstrate common patterns for the nutrition tracking app
 */

import { prisma } from './prisma';

/**
 * USER EXAMPLES
 */

export async function createUser(email: string, name: string) {
  return await prisma.user.create({
    data: {
      email,
      name,
    },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      goals: {
        where: { isActive: true },
      },
    },
  });
}

/**
 * FOOD ITEM EXAMPLES
 */

export async function searchFoodItems(query: string) {
  return await prisma.foodItem.findMany({
    where: {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    },
    include: {
      nutrition: true,
    },
    take: 20,
  });
}

export async function getFoodItemWithNutrition(foodItemId: string) {
  return await prisma.foodItem.findUnique({
    where: { id: foodItemId },
    include: {
      nutrition: true,
    },
  });
}

export async function createCustomFoodItem(
  name: string,
  servingSize: string,
  servingUnit: string,
  nutritionData: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  },
  userId: string
) {
  return await prisma.foodItem.create({
    data: {
      name,
      servingSize,
      servingUnit,
      isCustom: true,
      createdBy: userId,
      nutrition: {
        create: nutritionData,
      },
    },
    include: {
      nutrition: true,
    },
  });
}

/**
 * MEAL EXAMPLES
 */

export async function createMeal(
  userId: string,
  name: string,
  mealType: string,
  date: Date,
  foodItems: Array<{ foodItemId: string; quantity: number; servingSize: string }>
) {
  return await prisma.meal.create({
    data: {
      userId,
      name,
      mealType,
      date,
      foodItems: {
        create: foodItems.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          servingSize: item.servingSize,
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
}

export async function getUserMealsForDate(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.meal.findMany({
    where: {
      userId,
      date: {
        gte: startOfDay,
        lte: endOfDay,
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
    orderBy: {
      date: 'asc',
    },
  });
}

export async function getUserMealsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.meal.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
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
    orderBy: {
      date: 'asc',
    },
  });
}

/**
 * USER GOAL EXAMPLES
 */

export async function setUserGoal(
  userId: string,
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  }
) {
  // Deactivate previous goals
  await prisma.userGoal.updateMany({
    where: {
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
      endDate: new Date(),
    },
  });

  // Create new goal
  return await prisma.userGoal.create({
    data: {
      userId,
      ...goals,
      isActive: true,
    },
  });
}

export async function getActiveUserGoal(userId: string) {
  return await prisma.userGoal.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });
}

/**
 * DAILY LOG EXAMPLES
 */

export async function createOrUpdateDailyLog(
  userId: string,
  date: Date,
  totals: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
    totalSugar: number;
    waterIntake?: number;
  }
) {
  return await prisma.dailyLog.upsert({
    where: {
      date,
    },
    update: totals,
    create: {
      userId,
      date,
      ...totals,
    },
  });
}

export async function getDailyLog(userId: string, date: Date) {
  return await prisma.dailyLog.findFirst({
    where: {
      userId,
      date,
    },
    include: {
      meals: {
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
      },
    },
  });
}

/**
 * Calculate nutrition totals from meals
 */
export function calculateNutritionTotals(meals: any[]) {
  const totals = {
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalSugar: 0,
  };

  for (const meal of meals) {
    for (const item of meal.foodItems) {
      const nutrition = item.foodItem.nutrition;
      const quantity = item.quantity;

      totals.totalCalories += nutrition.calories * quantity;
      totals.totalProtein += nutrition.protein * quantity;
      totals.totalCarbs += nutrition.carbs * quantity;
      totals.totalFat += nutrition.fat * quantity;
      totals.totalFiber += (nutrition.fiber || 0) * quantity;
      totals.totalSugar += (nutrition.sugar || 0) * quantity;
    }
  }

  return totals;
}

/**
 * MEAL TEMPLATE EXAMPLES
 */

export async function createMealTemplate(
  userId: string,
  name: string,
  mealType: string,
  description: string | null,
  foodItems: Array<{ foodItemId: string; quantity: number; servingSize: string }>
) {
  return await prisma.mealTemplate.create({
    data: {
      userId,
      name,
      mealType,
      description,
      foodItems: {
        create: foodItems.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          servingSize: item.servingSize,
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
}

export async function getUserMealTemplates(userId: string) {
  return await prisma.mealTemplate.findMany({
    where: {
      userId,
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
}

export async function createMealFromTemplate(
  userId: string,
  templateId: string,
  date: Date
) {
  const template = await prisma.mealTemplate.findUnique({
    where: { id: templateId },
    include: {
      foodItems: true,
    },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  return await prisma.meal.create({
    data: {
      userId,
      name: template.name,
      mealType: template.mealType,
      date,
      foodItems: {
        create: template.foodItems.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          servingSize: item.servingSize,
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
}
