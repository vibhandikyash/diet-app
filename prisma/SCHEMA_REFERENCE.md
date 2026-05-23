# Prisma Schema Quick Reference

## Models Overview

```
User
├── Meal (one-to-many)
├── UserGoal (one-to-many)
├── DailyLog (one-to-many)
└── MealTemplate (one-to-many)

Meal
├── User (many-to-one)
├── FoodItem (many-to-many via MealFoodItem)
└── DailyLog (many-to-one, optional)

FoodItem
├── NutritionData (one-to-one)
├── Meal (many-to-many via MealFoodItem)
└── MealTemplate (many-to-many via TemplateFoodItem)

DailyLog
├── User (many-to-one)
└── Meal (one-to-many)
```

## Field Reference

### User
```typescript
{
  id: string          // cuid
  email: string       // unique, indexed
  name: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Meal
```typescript
{
  id: string          // cuid
  userId: string      // indexed, FK → User
  name: string
  date: DateTime      // indexed
  mealType: string    // breakfast|lunch|dinner|snack
  notes?: string
  dailyLogId?: string // FK → DailyLog
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Indexes**: userId, date, userId+date

### FoodItem
```typescript
{
  id: string          // cuid
  name: string        // indexed
  brand?: string
  servingSize: string
  servingUnit: string
  barcode?: string    // unique, indexed
  isCustom: boolean   // default: false
  createdBy?: string  // userId for custom foods
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Indexes**: name, barcode

### UserGoal
```typescript
{
  id: string          // cuid
  userId: string      // indexed, FK → User
  calories: number
  protein: number     // grams
  carbs: number       // grams
  fat: number         // grams
  fiber?: number      // grams
  sugar?: number      // grams
  startDate: DateTime
  endDate?: DateTime
  isActive: boolean   // default: true, indexed with userId
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Indexes**: userId, userId+isActive

### DailyLog
```typescript
{
  id: string          // cuid
  userId: string      // indexed, FK → User
  date: DateTime      // unique, indexed
  totalCalories: number    // default: 0
  totalProtein: number     // default: 0
  totalCarbs: number       // default: 0
  totalFat: number         // default: 0
  totalFiber: number       // default: 0
  totalSugar: number       // default: 0
  waterIntake: number      // ml, default: 0
  notes?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Indexes**: userId, date, userId+date  
**Unique**: date

### MealTemplate
```typescript
{
  id: string          // cuid
  userId: string      // indexed, FK → User
  name: string
  description?: string
  mealType: string    // breakfast|lunch|dinner|snack, indexed with userId
  isPublic: boolean   // default: false
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Indexes**: userId, userId+mealType

### NutritionData
```typescript
{
  id: string          // cuid
  foodItemId: string  // unique, indexed, FK → FoodItem
  calories: number
  protein: number     // grams
  carbs: number       // grams
  fat: number         // grams
  fiber?: number      // grams
  sugar?: number      // grams
  sodium?: number     // mg
  cholesterol?: number     // mg
  saturatedFat?: number    // grams
  transFat?: number        // grams
  vitaminA?: number        // mcg
  vitaminC?: number        // mg
  calcium?: number         // mg
  iron?: number            // mg
  createdAt: DateTime
  updatedAt: DateTime
}
```
**Unique**: foodItemId

### MealFoodItem (Junction)
```typescript
{
  id: string          // cuid
  mealId: string      // indexed, FK → Meal
  foodItemId: string  // indexed, FK → FoodItem
  quantity: number    // default: 1
  servingSize: string
  createdAt: DateTime
}
```
**Unique**: mealId+foodItemId

### TemplateFoodItem (Junction)
```typescript
{
  id: string          // cuid
  templateId: string  // indexed, FK → MealTemplate
  foodItemId: string  // indexed, FK → FoodItem
  quantity: number    // default: 1
  servingSize: string
  createdAt: DateTime
}
```
**Unique**: templateId+foodItemId

## Common Query Patterns

### Get user with active goal
```typescript
await prisma.user.findUnique({
  where: { email },
  include: { goals: { where: { isActive: true } } }
});
```

### Search foods
```typescript
await prisma.foodItem.findMany({
  where: { name: { contains: query, mode: 'insensitive' } },
  include: { nutrition: true },
  take: 20
});
```

### Get meals for a date
```typescript
await prisma.meal.findMany({
  where: {
    userId,
    date: { gte: startOfDay, lte: endOfDay }
  },
  include: {
    foodItems: {
      include: {
        foodItem: { include: { nutrition: true } }
      }
    }
  }
});
```

### Create meal with foods
```typescript
await prisma.meal.create({
  data: {
    userId,
    name: "Breakfast",
    mealType: "breakfast",
    date: new Date(),
    foodItems: {
      create: [
        { foodItemId: "...", quantity: 2, servingSize: "1 medium" }
      ]
    }
  }
});
```

### Update or create daily log
```typescript
await prisma.dailyLog.upsert({
  where: { date },
  update: { totalCalories, ... },
  create: { userId, date, totalCalories, ... }
});
```

## Meal Types

Standard values: `breakfast`, `lunch`, `dinner`, `snack`

## Units

- Macros: grams (protein, carbs, fat, fiber, sugar, saturated fat, trans fat)
- Sodium/Cholesterol: milligrams (mg)
- Vitamins/Minerals: varies (mcg for Vitamin A, mg for others)
- Water: milliliters (ml)
- Serving: string (flexible: "1 cup", "100g", "1 medium", etc.)

## Best Practices

1. **Always include nutrition data when querying food items**
   ```typescript
   include: { nutrition: true }
   ```

2. **Use compound indexes for date range queries**
   - userId+date index optimizes user-specific date queries

3. **Cascade deletes are configured**
   - Deleting a user removes all their data
   - Deleting a meal removes all MealFoodItem records

4. **Use upsert for daily logs**
   - Prevents duplicate entries (unique constraint on date)

5. **Deactivate old goals before creating new ones**
   ```typescript
   await prisma.userGoal.updateMany({
     where: { userId, isActive: true },
     data: { isActive: false, endDate: new Date() }
   });
   ```

## Environment Variables

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

## Useful Commands

```bash
npx prisma studio          # Open database GUI
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Create and apply migration
npx prisma migrate deploy  # Apply migrations (production)
npx prisma db seed         # Run seed script
npx prisma db push         # Push schema without migration
npx prisma format          # Format schema file
npx prisma validate        # Validate schema
```
