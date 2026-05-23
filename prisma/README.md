# Database Setup Guide

This project uses Prisma ORM with PostgreSQL for nutrition tracking.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed

## Setup Instructions

### 1. Configure Environment Variables

Copy the example environment file and update it with your database credentials:

```bash
cp .env.example .env
```

Update `DATABASE_URL` in `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### 2. Install Dependencies

```bash
npm install
```

This will install Prisma Client and other dependencies.

### 3. Run Migrations

Apply the database schema to your PostgreSQL database:

```bash
npx prisma migrate deploy
```

Or for development (creates migration if schema changed):

```bash
npm run db:migrate
```

### 4. Generate Prisma Client

Generate the Prisma Client types:

```bash
npx prisma generate
```

### 5. Seed the Database

Populate the database with sample food items:

```bash
npm run db:seed
```

This will create 25 common food items with complete nutrition data.

## Database Schema

The database includes 7 main models:

- **User**: User accounts
- **Meal**: Individual meal entries
- **FoodItem**: Food items database
- **UserGoal**: User's nutrition goals
- **DailyLog**: Daily nutrition summary
- **MealTemplate**: Saved meal templates
- **NutritionData**: Nutrition facts for food items

Plus junction tables:
- **MealFoodItem**: Links meals to food items
- **TemplateFoodItem**: Links templates to food items

## Useful Commands

```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Create a new migration after schema changes
npx prisma migrate dev --name describe_your_changes

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Database Indexes

The schema includes indexes on frequently queried fields:
- `userId` on Meal, UserGoal, DailyLog, MealTemplate
- `date` on Meal and DailyLog
- Combined `userId + date` on Meal and DailyLog
- `email` on User
- `name` and `barcode` on FoodItem

These indexes optimize common queries like fetching a user's meals for a specific date range.
