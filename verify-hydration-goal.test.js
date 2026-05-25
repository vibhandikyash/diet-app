/**
 * Verification tests for hydration goal API endpoints.
 * Verifies acceptance criteria:
 * 1. GET /api/hydration/goal returns authenticated user's current goal or 404
 * 2. POST /api/hydration/goal creates a new goal with dailyTargetCups validation
 * 3. PATCH /api/hydration/goal updates an existing goal and returns the record
 * 4. All endpoints require authentication and use the requesting user's data
 * 5. dailyTargetCups is a positive number between 1 and 30
 */

const fs = require('fs');
const path = require('path');

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

const routePath = path.join('src', 'app', 'api', 'hydration', 'goal', 'route.ts');
const validationPath = path.join('src', 'lib', 'hydration-goal-validation.ts');

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

test('Hydration goal API route exists', () => {
  assert(fs.existsSync(routePath), 'Expected /api/hydration/goal route.ts to exist');
});

test('Hydration goal API exports GET, POST, and PATCH handlers', () => {
  const content = readFile(routePath);

  assert(/export\s+async\s+function\s+GET/.test(content), 'Missing exported GET handler');
  assert(/export\s+async\s+function\s+POST/.test(content), 'Missing exported POST handler');
  assert(/export\s+async\s+function\s+PATCH/.test(content), 'Missing exported PATCH handler');
});

test('Hydration goal endpoints require authenticated sessions', () => {
  const content = readFile(routePath);

  assert(content.includes('getServerSession'), 'Route must read the server session');
  assert(content.includes('authOptions'), 'Route must use shared authOptions');
  assert(/status:\s*401/.test(content), 'Route must return 401 for unauthenticated requests');
});

test('Hydration goal queries are scoped to the authenticated user', () => {
  const content = readFile(routePath);

  assert(content.includes('session.user.id'), 'Route must use session.user.id');
  assert(/where:\s*{\s*userId\s*}/.test(content), 'Prisma queries must filter by the authenticated userId');
});

test('GET returns the current user goal and 404 when absent', () => {
  const content = readFile(routePath);

  assert(content.includes('hydrationGoal.findFirst'), 'GET should find the current hydration goal');
  assert(/orderBy:\s*{\s*updatedAt:\s*['"]desc['"]/.test(content), 'GET should use the most recently updated goal');
  assert(/status:\s*404/.test(content), 'GET should return 404 when no goal exists');
});

test('POST creates a user hydration goal with validated dailyTargetCups', () => {
  const content = readFile(routePath);

  assert(content.includes('validateDailyTargetCups'), 'POST should validate dailyTargetCups');
  assert(content.includes('hydrationGoal.create'), 'POST should create a hydration goal');
  assert(content.includes('dailyTargetCups'), 'POST should persist dailyTargetCups');
  assert(/status:\s*201/.test(content), 'POST should return 201 when creating a goal');
});

test('PATCH updates the authenticated user current goal', () => {
  const content = readFile(routePath);

  assert(content.includes('hydrationGoal.update'), 'PATCH should update a hydration goal');
  assert(/where:\s*{\s*id:\s*existingGoal\.id\s*}/.test(content), 'PATCH should update the existing user-scoped goal');
  assert(/status:\s*404/.test(content), 'PATCH should return 404 when no goal exists');
});

test('dailyTargetCups validation enforces integer range 1 through 30', () => {
  const content = readFile(validationPath);

  assert(fs.existsSync(validationPath), 'Expected hydration goal validation helper to exist');
  assert(content.includes('Number.isInteger'), 'Validation should require whole cup counts');
  assert(/dailyTargetCups\s*<\s*1/.test(content), 'Validation should reject values below 1');
  assert(/dailyTargetCups\s*>\s*30/.test(content), 'Validation should reject values above 30');
});

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
