/**
 * Verification tests for Prisma schema setup
 * These tests verify the acceptance criteria for the Prisma nutrition tracking schema
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Prisma dependencies installed
test('package.json has Prisma dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.['@prisma/client'], '@prisma/client not found in dependencies');
  assert(pkg.devDependencies?.prisma, 'prisma not found in devDependencies');
});

// Test 2: Prisma schema file exists
test('prisma/schema.prisma exists', () => {
  assert(fs.existsSync('prisma/schema.prisma'), 'prisma/schema.prisma not found');
});

// Test 3: All 7 models are defined in schema
test('Schema contains User model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model User'), 'User model not found in schema');
  assert(schema.match(/model User\s*{/), 'User model definition malformed');
});

test('Schema contains Meal model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model Meal'), 'Meal model not found in schema');
});

test('Schema contains FoodItem model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model FoodItem'), 'FoodItem model not found in schema');
});

test('Schema contains UserGoal model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model UserGoal'), 'UserGoal model not found in schema');
});

test('Schema contains DailyLog model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model DailyLog'), 'DailyLog model not found in schema');
});

test('Schema contains MealTemplate model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model MealTemplate'), 'MealTemplate model not found in schema');
});

test('Schema contains NutritionData model', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(schema.includes('model NutritionData'), 'NutritionData model not found in schema');
});

// Test 4: Schema has correct relationships
test('User has relationship with meals', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const userModel = schema.match(/model User\s*{[^}]+}/s)?.[0] || '';
  assert(
    userModel.includes('meals') || userModel.includes('Meal'),
    'User model missing meals relationship'
  );
});

test('Meal has relationship with user', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const mealModel = schema.match(/model Meal\s*{[^}]+}/s)?.[0] || '';
  assert(
    mealModel.includes('user') || mealModel.includes('User'),
    'Meal model missing user relationship'
  );
});

test('FoodItem has relationship with NutritionData', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const foodModel = schema.match(/model FoodItem\s*{[^}]+}/s)?.[0] || '';
  assert(
    foodModel.includes('nutrition') || foodModel.includes('NutritionData'),
    'FoodItem model missing nutrition relationship'
  );
});

// Test 5: Schema has indexes on frequently queried fields
test('Schema has index on userId fields', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(
    schema.includes('@@index([userId])') || schema.includes('@@index([user'),
    'Missing index on userId field'
  );
});

test('Schema has index on date fields', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(
    schema.includes('@@index([date])') || schema.includes('@@index([createdAt'),
    'Missing index on date field'
  );
});

// Test 6: PostgreSQL provider configured
test('Schema uses PostgreSQL provider', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(
    schema.includes('provider = "postgresql"'),
    'Schema not configured for PostgreSQL'
  );
});

test('Schema has DATABASE_URL environment variable', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  assert(
    schema.includes('env("DATABASE_URL")'),
    'DATABASE_URL environment variable not configured'
  );
});

// Test 7: Prisma Client generates successfully
test('Prisma Client can generate', () => {
  try {
    execSync('npx prisma generate', { stdio: 'pipe' });
    assert(true, 'Prisma generate succeeded');
  } catch (error) {
    throw new Error('Prisma generate failed: ' + error.message);
  }
});

test('@prisma/client types are available', () => {
  assert(
    fs.existsSync('node_modules/@prisma/client'),
    '@prisma/client module not found after generation'
  );
});

// Test 8: Migration files exist
test('Initial migration exists', () => {
  const migrationsDir = 'prisma/migrations';
  assert(fs.existsSync(migrationsDir), 'prisma/migrations directory not found');

  const migrations = fs.readdirSync(migrationsDir).filter(f => f !== 'migration_lock.toml');
  assert(migrations.length > 0, 'No migration files found');
});

// Test 9: Seed script exists and has content
test('prisma/seed.ts exists', () => {
  const seedExists = fs.existsSync('prisma/seed.ts') || fs.existsSync('prisma/seed.js');
  assert(seedExists, 'prisma/seed.ts or seed.js not found');
});

test('Seed script has at least 20 food items', () => {
  const seedPath = fs.existsSync('prisma/seed.ts') ? 'prisma/seed.ts' : 'prisma/seed.js';
  const seedContent = fs.readFileSync(seedPath, 'utf8');

  // Count food item definitions (looking for common patterns)
  const foodPatterns = [
    /name:\s*['"]/g,
    /create.*food/gi,
    /FoodItem/g
  ];

  let matches = 0;
  for (const pattern of foodPatterns) {
    const found = seedContent.match(pattern);
    if (found && found.length > matches) {
      matches = found.length;
    }
  }

  assert(
    matches >= 20,
    `Seed script appears to have fewer than 20 food items (found ~${matches} references)`
  );
});

test('Seed script imports PrismaClient', () => {
  const seedPath = fs.existsSync('prisma/seed.ts') ? 'prisma/seed.ts' : 'prisma/seed.js';
  const seedContent = fs.readFileSync(seedPath, 'utf8');
  assert(
    seedContent.includes('PrismaClient') || seedContent.includes('@prisma/client'),
    'Seed script does not import PrismaClient'
  );
});

test('package.json has prisma seed configuration', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(
    pkg.prisma?.seed,
    'package.json missing prisma.seed configuration'
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
