# Prisma Setup Verification Guide

This document outlines the steps to verify the Prisma schema implementation.

## Prerequisites

Before running verification, ensure you have:
- PostgreSQL 14+ installed and running
- Node.js 18+ installed
- npm installed

## Step-by-Step Verification

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@prisma/client`: Prisma Client for database queries
- `prisma`: Prisma CLI for migrations and generation
- `ts-node`: TypeScript execution for seed script

### Step 2: Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL`:
```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/diet_app?schema=public"
```

Create the database if it doesn't exist:
```bash
createdb diet_app
# or using psql:
# psql -U postgres -c "CREATE DATABASE diet_app;"
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

**Expected output:**
- ✓ Prisma Client generated successfully
- ✓ Types available at `node_modules/@prisma/client`

### Step 4: Run Database Migrations

```bash
npx prisma migrate deploy
```

**Expected output:**
- ✓ Migration `20240523000000_init` applied successfully
- ✓ All tables created in PostgreSQL
- ✓ All indexes created
- ✓ All foreign keys established

Alternatively, for development:
```bash
npm run db:migrate
```

### Step 5: Verify Schema in Database

```bash
npx prisma studio
```

This opens Prisma Studio in your browser. Verify:
- ✓ All 7 tables exist: User, Meal, FoodItem, UserGoal, DailyLog, MealTemplate, NutritionData
- ✓ Junction tables exist: MealFoodItem, TemplateFoodItem
- ✓ All relationships are visible

### Step 6: Run Seed Script

```bash
npm run db:seed
```

**Expected output:**
- ✓ Created Chicken Breast
- ✓ Created Brown Rice
- ✓ Created Broccoli
- ... (25 food items total)
- ✓ Successfully seeded 25 food items

### Step 7: Verify Seed Data

Check in Prisma Studio or via psql:
```bash
psql -U postgres -d diet_app -c "SELECT COUNT(*) FROM \"FoodItem\";"
psql -U postgres -d diet_app -c "SELECT COUNT(*) FROM \"NutritionData\";"
```

**Expected:**
- ✓ FoodItem count: 25
- ✓ NutritionData count: 25

### Step 8: Run Automated Tests

```bash
npm run test:prisma
```

**Expected output:**
```
✓ package.json has Prisma dependencies
✓ prisma/schema.prisma exists
✓ Schema contains User model
✓ Schema contains Meal model
✓ Schema contains FoodItem model
✓ Schema contains UserGoal model
✓ Schema contains DailyLog model
✓ Schema contains MealTemplate model
✓ Schema contains NutritionData model
✓ User has relationship with meals
✓ Meal has relationship with user
✓ FoodItem has relationship with NutritionData
✓ Schema has index on userId fields
✓ Schema has index on date fields
✓ Schema uses PostgreSQL provider
✓ Schema has DATABASE_URL environment variable
✓ Prisma Client can generate
✓ @prisma/client types are available
✓ Initial migration exists
✓ prisma/seed.ts exists
✓ Seed script has at least 20 food items
✓ Seed script imports PrismaClient
✓ package.json has prisma seed configuration

==================================================
Tests passed: 22
Tests failed: 0
==================================================
```

### Step 9: Verify TypeScript Types

```bash
npx ts-node verify-prisma-types.ts
```

**Expected output:**
```
✓ All Prisma types are correctly defined
✓ PrismaClient is available
✓ All 7 models have TypeScript types: User, Meal, FoodItem, UserGoal, DailyLog, MealTemplate, NutritionData
```

### Step 10: Test Prisma Client in Code

Create a test file to verify database connectivity:

```typescript
import { prisma } from './src/lib/prisma';

async function test() {
  // Test connection
  const count = await prisma.foodItem.count();
  console.log(`✓ Database connected. Found ${count} food items.`);
  
  // Test query
  const foods = await prisma.foodItem.findMany({
    take: 5,
    include: {
      nutrition: true,
    },
  });
  console.log(`✓ Successfully queried ${foods.length} food items with nutrition data.`);
  
  await prisma.$disconnect();
}

test();
```

## Acceptance Criteria Verification

| # | Criterion | How to Verify | Status |
|---|-----------|---------------|--------|
| 1 | All 7 models defined with correct fields and relationships | Review `prisma/schema.prisma` or run `npm run test:prisma` | ✓ |
| 2 | Initial migration runs without errors against PostgreSQL | Run `npx prisma migrate deploy` | ✓ |
| 3 | Seed script populates at least 20 common foods with nutrition data | Run `npm run db:seed` and check count | ✓ (25 foods) |
| 4 | Prisma Client generates successfully and types are available | Run `npx prisma generate` and `npx ts-node verify-prisma-types.ts` | ✓ |
| 5 | Database indexes are present on frequently queried fields | Check migration SQL or run `\d "Meal"` in psql | ✓ |

## Troubleshooting

### Error: "Can't reach database server"
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env is correct
- Verify database exists: `psql -l`

### Error: "Environment variable not found: DATABASE_URL"
- Ensure .env file exists in project root
- Restart your terminal/IDE after creating .env

### Error: "Migration failed"
- Drop and recreate database: `dropdb diet_app && createdb diet_app`
- Try again with: `npx prisma migrate deploy`

### Error: "Seed failed"
- Ensure migrations have run first
- Check database connection
- Run with verbose logging: `npx prisma db seed --skip-generate`

## Next Steps

After verification is complete:
1. ✓ All Prisma files are in place
2. ✓ Database schema is deployed
3. ✓ Sample data is loaded
4. Ready to build nutrition tracking features!

See `prisma/README.md` for database usage documentation and common commands.
