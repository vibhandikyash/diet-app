# diet-app

A Next.js 14 application for tracking diet and nutrition, built with TypeScript and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Date Handling**: date-fns
- **Linting**: ESLint with Next.js config

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and update DATABASE_URL with your PostgreSQL connection string

# Run database migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed the database with sample food items
npm run db:seed

# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Run verification tests
npm run test:setup
npm run test:prisma
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Root layout with metadata
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles with Tailwind
│   └── lib/
│       └── prisma.ts       # Prisma Client singleton
├── prisma/
│   ├── schema.prisma       # Database schema (7 models)
│   ├── seed.ts             # Database seed script (25 foods)
│   ├── migrations/         # Database migrations
│   └── README.md           # Database setup guide
├── verify-setup.test.js    # Setup verification tests
├── verify-prisma.test.js   # Prisma verification tests
├── next.config.mjs         # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.mjs      # PostCSS configuration
└── tsconfig.json           # TypeScript configuration (strict mode)
```

## Verification

Run the setup verification tests to ensure all requirements are met:

```bash
# Verify Next.js setup
npm run test:setup

# Verify Prisma schema and database
npm run test:prisma
```

**Next.js Setup Tests** verify:
- ✓ All required dependencies are installed
- ✓ TypeScript is configured with strict mode
- ✓ Tailwind CSS is properly configured
- ✓ App Router structure is in place
- ✓ ESLint configuration exists

**Prisma Tests** verify:
- ✓ Prisma dependencies installed
- ✓ All 7 models defined (User, Meal, FoodItem, UserGoal, DailyLog, MealTemplate, NutritionData)
- ✓ Model relationships configured correctly
- ✓ Database indexes on userId and date fields
- ✓ PostgreSQL provider configured
- ✓ Prisma Client generates successfully
- ✓ Migrations exist and run successfully
- ✓ Seed script has 20+ food items

## Database Models

See [prisma/README.md](prisma/README.md) for detailed database documentation.

The schema includes:
- **User**: User accounts and authentication
- **Meal**: Individual meal entries with date/time
- **FoodItem**: Searchable food items database
- **UserGoal**: User's nutrition goals and targets
- **DailyLog**: Daily nutrition summary and totals
- **MealTemplate**: Reusable meal templates
- **NutritionData**: Complete nutrition facts per food item
