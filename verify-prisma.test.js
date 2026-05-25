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

function readSchema() {
  return fs.readFileSync('prisma/schema.prisma', 'utf8');
}

function getModel(schema, modelName) {
  return schema.match(new RegExp(`model ${modelName}\\s*{[^}]+}`, 's'))?.[0] || '';
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
  const schema = readSchema();
  assert(schema.includes('model User'), 'User model not found in schema');
  assert(schema.match(/model User\s*{/), 'User model definition malformed');
});

test('Schema contains Meal model', () => {
  const schema = readSchema();
  assert(schema.includes('model Meal'), 'Meal model not found in schema');
});

test('Schema contains FoodItem model', () => {
  const schema = readSchema();
  assert(schema.includes('model FoodItem'), 'FoodItem model not found in schema');
});

test('Schema contains UserGoal model', () => {
  const schema = readSchema();
  assert(schema.includes('model UserGoal'), 'UserGoal model not found in schema');
});

test('Schema contains DailyLog model', () => {
  const schema = readSchema();
  assert(schema.includes('model DailyLog'), 'DailyLog model not found in schema');
});

test('Schema contains MealTemplate model', () => {
  const schema = readSchema();
  assert(schema.includes('model MealTemplate'), 'MealTemplate model not found in schema');
});

test('Schema contains NutritionData model', () => {
  const schema = readSchema();
  assert(schema.includes('model NutritionData'), 'NutritionData model not found in schema');
});

test('Schema contains organization habit foundation models', () => {
  const schema = readSchema();
  for (const model of [
    'User',
    'Organization',
    'OrganizationMembership',
    'Habit',
    'HabitAssignment',
    'CheckIn',
    'Streak'
  ]) {
    assert(schema.includes(`model ${model}`), `${model} model not found in schema`);
  }
});

// Test 4: Schema has correct relationships
test('User has relationship with meals', () => {
  const userModel = getModel(readSchema(), 'User');
  assert(
    userModel.includes('meals') || userModel.includes('Meal'),
    'User model missing meals relationship'
  );
});

test('Meal has relationship with user', () => {
  const mealModel = getModel(readSchema(), 'Meal');
  assert(
    mealModel.includes('user') || mealModel.includes('User'),
    'Meal model missing user relationship'
  );
});

test('FoodItem has relationship with NutritionData', () => {
  const foodModel = getModel(readSchema(), 'FoodItem');
  assert(
    foodModel.includes('nutrition') || foodModel.includes('NutritionData'),
    'FoodItem model missing nutrition relationship'
  );
});

test('Schema contains hydration tracking models', () => {
  const schema = readSchema();
  for (const model of [
    'HydrationGoal',
    'HydrationLog',
    'DailyHydrationSummary',
    'HydrationPreferences'
  ]) {
    assert(schema.includes(`model ${model}`), `${model} model not found in schema`);
  }
});

test('User has relationships with hydration models', () => {
  const userModel = getModel(readSchema(), 'User');
  assert(userModel.includes('hydrationGoals'), 'User model missing hydrationGoals relationship');
  assert(userModel.includes('hydrationLogs'), 'User model missing hydrationLogs relationship');
  assert(
    userModel.includes('dailyHydrationSummaries'),
    'User model missing dailyHydrationSummaries relationship'
  );
  assert(
    userModel.includes('hydrationPreferences'),
    'User model missing hydrationPreferences relationship'
  );
});

test('HydrationGoal stores target cups and timestamps for a user', () => {
  const model = getModel(readSchema(), 'HydrationGoal');
  assert(model.includes('userId') && model.includes('String'), 'HydrationGoal missing userId');
  assert(
    model.includes('dailyTargetCups') && model.includes('Int'),
    'HydrationGoal missing dailyTargetCups Int field'
  );
  assert(model.includes('createdAt') && model.includes('@default(now())'), 'HydrationGoal missing createdAt default');
  assert(model.includes('updatedAt') && model.includes('@updatedAt'), 'HydrationGoal missing updatedAt timestamp');
  assert(model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'), 'HydrationGoal missing cascading User relation');
});

test('HydrationLog captures consumed cups, cup size, and loggedAt timestamp', () => {
  const model = getModel(readSchema(), 'HydrationLog');
  assert(model.includes('userId') && model.includes('String'), 'HydrationLog missing userId');
  assert(model.includes('cupsConsumed') && model.includes('Int'), 'HydrationLog missing cupsConsumed Int field');
  assert(model.includes('cupSize') && model.includes('Int'), 'HydrationLog missing cupSize Int field');
  assert(
    model.includes('loggedAt') && model.includes('@default(now())'),
    'HydrationLog missing loggedAt default timestamp'
  );
  assert(model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'), 'HydrationLog missing cascading User relation');
});

test('DailyHydrationSummary aggregates cups and goal status per user per day', () => {
  const model = getModel(readSchema(), 'DailyHydrationSummary');
  assert(model.includes('userId') && model.includes('String'), 'DailyHydrationSummary missing userId');
  assert(model.includes('date') && model.includes('DateTime'), 'DailyHydrationSummary missing date');
  assert(model.includes('totalCups') && model.includes('Int'), 'DailyHydrationSummary missing totalCups Int field');
  assert(
    model.includes('goalAchieved') && model.includes('Boolean?'),
    'DailyHydrationSummary missing nullable goalAchieved Boolean field'
  );
  assert(
    model.includes('@@unique([userId, date])'),
    'DailyHydrationSummary missing per-user per-day unique constraint'
  );
});

test('HydrationPreferences stores default cup size for one user', () => {
  const model = getModel(readSchema(), 'HydrationPreferences');
  assert(model.includes('userId') && model.includes('@unique'), 'HydrationPreferences missing unique userId');
  assert(
    model.includes('defaultCupSize') && model.includes('Int'),
    'HydrationPreferences missing defaultCupSize Int field'
  );
  assert(model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'), 'HydrationPreferences missing cascading User relation');
});

test('Organization belongs to an owner and cascades from User', () => {
  const model = getModel(readSchema(), 'Organization');
  assert(model.includes('ownerId') && model.includes('String'), 'Organization missing ownerId String field');
  assert(model.includes('memberships') && model.includes('OrganizationMembership[]'), 'Organization missing memberships relation');
  assert(model.includes('habits') && model.includes('Habit[]'), 'Organization missing habits relation');
  assert(
    model.includes('@relation("OrganizationOwner", fields: [ownerId], references: [id], onDelete: Cascade)'),
    'Organization missing cascading owner relation'
  );
});

test('OrganizationMembership links User and Organization with cascading deletes', () => {
  const model = getModel(readSchema(), 'OrganizationMembership');
  assert(model.includes('userId') && model.includes('String'), 'OrganizationMembership missing userId');
  assert(model.includes('organizationId') && model.includes('String'), 'OrganizationMembership missing organizationId');
  assert(model.includes('role') && model.includes('String'), 'OrganizationMembership missing role');
  assert(model.includes('@@unique([userId, organizationId])'), 'OrganizationMembership missing unique user/organization constraint');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'OrganizationMembership missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [organizationId], references: [id], onDelete: Cascade)'),
    'OrganizationMembership missing cascading Organization relation'
  );
});

test('Habit belongs to User and Organization and exposes assignments, check-ins, and streaks', () => {
  const model = getModel(readSchema(), 'Habit');
  assert(model.includes('userId') && model.includes('String'), 'Habit missing userId');
  assert(model.includes('organizationId') && model.includes('String'), 'Habit missing organizationId');
  assert(model.includes('assignments') && model.includes('HabitAssignment[]'), 'Habit missing assignments relation');
  assert(model.includes('checkIns') && model.includes('CheckIn[]'), 'Habit missing checkIns relation');
  assert(model.includes('streaks') && model.includes('Streak[]'), 'Habit missing streaks relation');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'Habit missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [organizationId], references: [id], onDelete: Cascade)'),
    'Habit missing cascading Organization relation'
  );
});

test('HabitAssignment links assigned users to habits with cascading deletes', () => {
  const model = getModel(readSchema(), 'HabitAssignment');
  assert(model.includes('userId') && model.includes('String'), 'HabitAssignment missing userId');
  assert(model.includes('habitId') && model.includes('String'), 'HabitAssignment missing habitId');
  assert(model.includes('assignedAt') && model.includes('@default(now())'), 'HabitAssignment missing assignedAt default');
  assert(model.includes('@@unique([habitId, userId])'), 'HabitAssignment missing unique habit/user constraint');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'HabitAssignment missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [habitId], references: [id], onDelete: Cascade)'),
    'HabitAssignment missing cascading Habit relation'
  );
});

test('CheckIn stores one user habit result per date with cascading deletes', () => {
  const model = getModel(readSchema(), 'CheckIn');
  assert(model.includes('userId') && model.includes('String'), 'CheckIn missing userId');
  assert(model.includes('habitId') && model.includes('String'), 'CheckIn missing habitId');
  assert(model.includes('date') && model.includes('DateTime'), 'CheckIn missing date');
  assert(model.includes('completed') && model.includes('Boolean'), 'CheckIn missing completed flag');
  assert(model.includes('@@unique([habitId, userId, date])'), 'CheckIn missing unique habit/user/date constraint');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'CheckIn missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [habitId], references: [id], onDelete: Cascade)'),
    'CheckIn missing cascading Habit relation'
  );
});

test('Streak stores current and best streaks by user and habit with cascading deletes', () => {
  const model = getModel(readSchema(), 'Streak');
  assert(model.includes('userId') && model.includes('String'), 'Streak missing userId');
  assert(model.includes('habitId') && model.includes('String'), 'Streak missing habitId');
  assert(model.includes('currentCount') && model.includes('Int'), 'Streak missing currentCount Int field');
  assert(model.includes('bestCount') && model.includes('Int'), 'Streak missing bestCount Int field');
  assert(model.includes('lastCheckInDate') && model.includes('DateTime?'), 'Streak missing nullable lastCheckInDate');
  assert(model.includes('@@unique([habitId, userId])'), 'Streak missing unique habit/user constraint');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'Streak missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [habitId], references: [id], onDelete: Cascade)'),
    'Streak missing cascading Habit relation'
  );
});

// Test 5: Schema has indexes on frequently queried fields
test('Schema has index on userId fields', () => {
  const schema = readSchema();
  assert(
    schema.includes('@@index([userId])') || schema.includes('@@index([user'),
    'Missing index on userId field'
  );
});

test('Schema has index on date fields', () => {
  const schema = readSchema();
  assert(
    schema.includes('@@index([date])') || schema.includes('@@index([createdAt'),
    'Missing index on date field'
  );
});

test('Habit foundation indexes frequently queried userId, organizationId, habitId, and date fields', () => {
  const schema = readSchema();
  for (const index of [
    '@@index([userId])',
    '@@index([organizationId])',
    '@@index([habitId])',
    '@@index([date])'
  ]) {
    assert(schema.includes(index), `Missing ${index} for habit foundation queries`);
  }
});

// Test 6: PostgreSQL provider configured
test('Schema uses PostgreSQL provider', () => {
  const schema = readSchema();
  assert(
    schema.includes('provider = "postgresql"'),
    'Schema not configured for PostgreSQL'
  );
});

test('Schema has DATABASE_URL environment variable', () => {
  const schema = readSchema();
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

test('Hydration migration creates additive tables and constraints', () => {
  const migrationPath = path.join(
    'prisma',
    'migrations',
    '20260525000000_add_hydration_tracking',
    'migration.sql'
  );
  assert(fs.existsSync(migrationPath), 'Hydration migration file not found');

  const migration = fs.readFileSync(migrationPath, 'utf8');
  for (const table of [
    'HydrationGoal',
    'HydrationLog',
    'DailyHydrationSummary',
    'HydrationPreferences'
  ]) {
    assert(
      migration.includes(`CREATE TABLE "${table}"`),
      `Hydration migration missing ${table} table`
    );
    assert(
      migration.includes(`ALTER TABLE "${table}" ADD CONSTRAINT "${table}_userId_fkey"`),
      `Hydration migration missing ${table} user foreign key`
    );
  }

  assert(
    migration.includes('CREATE UNIQUE INDEX "DailyHydrationSummary_userId_date_key"'),
    'Hydration migration missing summary user/date uniqueness'
  );
  assert(
    migration.includes('CREATE UNIQUE INDEX "HydrationPreferences_userId_key"'),
    'Hydration migration missing one preferences row per user constraint'
  );
});

test('Habit foundation migration creates tables, indexes, and cascading constraints', () => {
  const migrationsDir = path.join('prisma', 'migrations');
  const migration = fs
    .readdirSync(migrationsDir)
    .filter((entry) => entry !== 'migration_lock.toml')
    .map((entry) => path.join(migrationsDir, entry, 'migration.sql'))
    .filter((migrationPath) => fs.existsSync(migrationPath))
    .map((migrationPath) => fs.readFileSync(migrationPath, 'utf8'))
    .join('\n');

  for (const table of ['Organization', 'OrganizationMembership', 'Habit', 'HabitAssignment', 'CheckIn', 'Streak']) {
    assert(migration.includes(`CREATE TABLE "${table}"`), `Habit foundation migration missing ${table} table`);
  }
  for (const index of [
    'CREATE INDEX "OrganizationMembership_userId_idx"',
    'CREATE INDEX "OrganizationMembership_organizationId_idx"',
    'CREATE INDEX "Habit_userId_idx"',
    'CREATE INDEX "Habit_organizationId_idx"',
    'CREATE INDEX "HabitAssignment_userId_idx"',
    'CREATE INDEX "HabitAssignment_habitId_idx"',
    'CREATE INDEX "CheckIn_userId_idx"',
    'CREATE INDEX "CheckIn_habitId_idx"',
    'CREATE INDEX "CheckIn_date_idx"',
    'CREATE INDEX "Streak_userId_idx"',
    'CREATE INDEX "Streak_habitId_idx"'
  ]) {
    assert(migration.includes(index), `Habit foundation migration missing ${index}`);
  }
  assert(migration.includes('ON DELETE CASCADE'), 'Habit foundation migration missing cascading deletes');
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
