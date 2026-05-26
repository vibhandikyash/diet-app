/**
 * Type checking verification for Prisma Client
 * This file ensures all Prisma models have correct TypeScript types
 */

import {
  Assignment,
  CheckIn,
  DailyLog,
  FoodItem,
  Habit,
  Meal,
  MealTemplate,
  NutritionData,
  Organization,
  PrismaClient,
  Streak,
  Team,
  User,
  UserGoal,
} from '@prisma/client';

// Verify PrismaClient exports all expected models
const prisma = new PrismaClient();

// Type checks - these will fail at compile time if types are wrong
const userCheck: User = {
  id: 'test',
  clerkId: null,
  email: 'test@example.com',
  name: 'Test User',
  password: 'hashed-password',
  role: 'member',
  organizationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const organizationCheck: Organization = {
  id: 'test',
  name: 'Test Organization',
  createdAt: new Date(),
};

const teamCheck: Team = {
  id: 'test',
  name: 'Test Team',
  organizationId: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const habitCheck: Habit = {
  id: 'test',
  title: 'Drink water',
  description: null,
  frequency: 'daily',
  createdById: 'test',
  teamId: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const assignmentCheck: Assignment = {
  id: 'test',
  habitId: 'test',
  userId: 'test',
  assignedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const checkInCheck: CheckIn = {
  id: 'test',
  assignmentId: 'test',
  completedAt: new Date(),
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const streakCheck: Streak = {
  id: 'test',
  assignmentId: 'test',
  currentStreak: 1,
  longestStreak: 3,
  lastCheckInDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mealCheck: Meal = {
  id: 'test',
  userId: 'test',
  name: 'Breakfast',
  date: new Date(),
  mealType: 'breakfast',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  dailyLogId: null,
};

const foodItemCheck: FoodItem = {
  id: 'test',
  name: 'Banana',
  brand: null,
  servingSize: '1',
  servingUnit: 'medium',
  barcode: null,
  isCustom: false,
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const userGoalCheck: UserGoal = {
  id: 'test',
  userId: 'test',
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 65,
  fiber: null,
  sugar: null,
  startDate: new Date(),
  endDate: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const dailyLogCheck: DailyLog = {
  id: 'test',
  userId: 'test',
  date: new Date(),
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  totalFiber: 0,
  totalSugar: 0,
  waterIntake: 0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mealTemplateCheck: MealTemplate = {
  id: 'test',
  userId: 'test',
  name: 'My Template',
  description: null,
  mealType: 'breakfast',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const nutritionDataCheck: NutritionData = {
  id: 'test',
  foodItemId: 'test',
  calories: 100,
  protein: 5.0,
  carbs: 20.0,
  fat: 2.0,
  fiber: null,
  sugar: null,
  sodium: null,
  cholesterol: null,
  saturatedFat: null,
  transFat: null,
  vitaminA: null,
  vitaminC: null,
  calcium: null,
  iron: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log('✓ All Prisma types are correctly defined');
console.log('✓ PrismaClient is available');
console.log(
  '✓ Foundation models have TypeScript types: User, Organization, Team, Habit, Assignment, CheckIn, Streak'
);
console.log('✓ Nutrition models have TypeScript types: Meal, FoodItem, UserGoal, DailyLog, MealTemplate, NutritionData');
