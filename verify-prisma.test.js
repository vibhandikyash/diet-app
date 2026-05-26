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

test('Schema contains approved habit foundation models', () => {
  const schema = readSchema();
  for (const model of [
    'User',
    'Organization',
    'Team',
    'Habit',
    'Assignment',
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

test('User includes approved identity, role, and organization fields', () => {
  const model = getModel(readSchema(), 'User');
  assert(model.includes('clerkId') && model.includes('String'), 'User missing clerkId String field');
  assert(model.includes('name') && model.includes('String'), 'User missing name String field');
  assert(model.includes('email') && model.includes('String'), 'User missing email String field');
  assert(model.includes('role') && model.includes('String'), 'User missing role String field');
  assert(model.includes('organizationId') && model.includes('String'), 'User missing organizationId String field');
  assert(
    model.includes('@relation(fields: [organizationId], references: [id], onDelete: Cascade)'),
    'User missing cascading Organization relation'
  );
});

test('Organization owns users and teams', () => {
  const model = getModel(readSchema(), 'Organization');
  assert(model.includes('id') && model.includes('@id'), 'Organization missing id primary key');
  assert(model.includes('name') && model.includes('String'), 'Organization missing name String field');
  assert(
    model.includes('createdAt') && model.includes('@default(now())'),
    'Organization missing createdAt default'
  );
  assert(model.includes('users') && model.includes('User[]'), 'Organization missing users relation');
  assert(model.includes('teams') && model.includes('Team[]'), 'Organization missing teams relation');
});

test('Team belongs to an organization and exposes habits', () => {
  const model = getModel(readSchema(), 'Team');
  assert(model.includes('organizationId') && model.includes('String'), 'Team missing organizationId String field');
  assert(model.includes('habits') && model.includes('Habit[]'), 'Team missing habits relation');
  assert(
    model.includes('@relation(fields: [organizationId], references: [id], onDelete: Cascade)'),
    'Team missing cascading Organization relation'
  );
});

test('Habit uses approved fields and belongs to creator and team', () => {
  const model = getModel(readSchema(), 'Habit');
  assert(model.includes('title') && model.includes('String'), 'Habit missing title String field');
  assert(model.includes('description') && model.includes('String?'), 'Habit missing optional description field');
  assert(model.includes('frequency') && model.includes('String'), 'Habit missing frequency String field');
  assert(model.includes('createdById') && model.includes('String'), 'Habit missing createdById String field');
  assert(model.includes('teamId') && model.includes('String'), 'Habit missing teamId');
  assert(model.includes('assignments') && model.includes('Assignment[]'), 'Habit missing assignments relation');
  assert(
    model.includes('@relation(fields: [createdById], references: [id], onDelete: Cascade)'),
    'Habit missing cascading creator relation'
  );
  assert(
    model.includes('@relation(fields: [teamId], references: [id], onDelete: Cascade)'),
    'Habit missing cascading Team relation'
  );
});

test('Assignment links habits to users with cascading deletes', () => {
  const model = getModel(readSchema(), 'Assignment');
  assert(model.includes('habitId') && model.includes('String'), 'Assignment missing habitId');
  assert(model.includes('userId') && model.includes('String'), 'Assignment missing userId');
  assert(model.includes('assignedAt') && model.includes('@default(now())'), 'Assignment missing assignedAt default');
  assert(model.includes('checkIns') && model.includes('CheckIn[]'), 'Assignment missing checkIns relation');
  assert(model.includes('streak') && model.includes('Streak?'), 'Assignment missing optional streak relation');
  assert(model.includes('@@unique([habitId, userId])'), 'Assignment missing unique habit/user constraint');
  assert(
    model.includes('@relation(fields: [userId], references: [id], onDelete: Cascade)'),
    'Assignment missing cascading User relation'
  );
  assert(
    model.includes('@relation(fields: [habitId], references: [id], onDelete: Cascade)'),
    'Assignment missing cascading Habit relation'
  );
});

test('CheckIn belongs to an assignment and records completion timestamp and notes', () => {
  const model = getModel(readSchema(), 'CheckIn');
  assert(model.includes('assignmentId') && model.includes('String'), 'CheckIn missing assignmentId');
  assert(model.includes('completedAt') && model.includes('DateTime'), 'CheckIn missing completedAt DateTime field');
  assert(model.includes('notes') && model.includes('String?'), 'CheckIn missing optional notes field');
  assert(
    model.includes('@relation(fields: [assignmentId], references: [id], onDelete: Cascade)'),
    'CheckIn missing cascading Assignment relation'
  );
});

test('Streak belongs to one assignment and stores current and longest streak counts', () => {
  const model = getModel(readSchema(), 'Streak');
  assert(model.includes('assignmentId') && model.includes('String'), 'Streak missing assignmentId');
  assert(model.includes('currentStreak') && model.includes('Int'), 'Streak missing currentStreak Int field');
  assert(model.includes('longestStreak') && model.includes('Int'), 'Streak missing longestStreak Int field');
  assert(model.includes('lastCheckInDate') && model.includes('DateTime?'), 'Streak missing nullable lastCheckInDate');
  assert(model.includes('assignmentId') && model.includes('@unique'), 'Streak missing unique assignmentId');
  assert(
    model.includes('@relation(fields: [assignmentId], references: [id], onDelete: Cascade)'),
    'Streak missing cascading Assignment relation'
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

test('Habit foundation indexes frequently queried organization, team, assignment, and completion fields', () => {
  const schema = readSchema();
  for (const index of [
    '@@index([organizationId])',
    '@@index([teamId])',
    '@@index([habitId])',
    '@@index([assignmentId])',
    '@@index([completedAt])'
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

test('Habit foundation migration creates approved tables, indexes, and cascading constraints', () => {
  const migrationPath = path.join(
    'prisma',
    'migrations',
    '20260525020000_add_habit_team_foundation',
    'migration.sql'
  );
  assert(fs.existsSync(migrationPath), 'Habit foundation migration file not found');

  const migration = fs.readFileSync(migrationPath, 'utf8');
  for (const table of ['Organization', 'Team', 'Habit', 'Assignment', 'CheckIn', 'Streak']) {
    assert(migration.includes(`CREATE TABLE "${table}"`), `Habit foundation migration missing ${table} table`);
  }
  for (const index of [
    'CREATE INDEX "User_organizationId_idx"',
    'CREATE INDEX "Team_organizationId_idx"',
    'CREATE INDEX "Habit_createdById_idx"',
    'CREATE INDEX "Habit_teamId_idx"',
    'CREATE INDEX "Assignment_userId_idx"',
    'CREATE INDEX "Assignment_habitId_idx"',
    'CREATE INDEX "CheckIn_assignmentId_idx"',
    'CREATE INDEX "CheckIn_completedAt_idx"'
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
