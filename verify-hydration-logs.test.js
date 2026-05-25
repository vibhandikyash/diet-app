/**
 * Verification tests for hydration log API routes.
 * These tests encode the CRUD, date filtering, auth, and ownership requirements.
 */

const fs = require('fs');

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

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const collectionRoute = 'src/app/api/hydration/logs/route.ts';
const itemRoute = 'src/app/api/hydration/logs/[id]/route.ts';
const validationHelper = 'src/lib/hydration-log-validation.ts';

test('Hydration logs collection route exists', () => {
  assert(fs.existsSync(collectionRoute), 'Missing /api/hydration/logs route');
});

test('Hydration log item route exists', () => {
  assert(fs.existsSync(itemRoute), 'Missing /api/hydration/logs/[id] route');
});

test('POST route creates hydration logs for authenticated user', () => {
  const content = read(collectionRoute);
  assert(content.includes('export async function POST'), 'POST handler missing');
  assert(content.includes('getServerSession'), 'POST route must read authenticated session');
  assert(content.includes('authOptions'), 'POST route must use app authOptions');
  assert(content.includes('prisma.hydrationLog.create'), 'POST route must create HydrationLog records');
  assert(content.includes('userId: session.user.id'), 'POST route must associate log with session user');
  assert(content.includes('cupsConsumed'), 'POST route must accept cupsConsumed');
  assert(content.includes('cupSize'), 'POST route must accept cupSize');
  assert(!/prisma\.hydrationLog\.create\([\s\S]*loggedAt\s*:/.test(content), 'POST route should rely on auto-generated loggedAt timestamp');
});

test('GET route lists authenticated user logs for a YYYY-MM-DD date', () => {
  const content = read(collectionRoute);
  assert(content.includes('export async function GET'), 'GET handler missing');
  assert(content.includes("searchParams.get('date')"), 'GET route must read date query parameter');
  assert(content.includes('getDateRange'), 'GET route must build a single-day date range');
  assert(content.includes('userId: session.user.id'), 'GET route must scope logs to session user');
  assert(content.includes('loggedAt:') && content.includes('gte') && content.includes('lt'), 'GET route must filter loggedAt by date range');
  assert(content.includes('orderBy') && content.includes('loggedAt'), 'GET route should order logs by timestamp');
});

test('PATCH route updates only allowed hydration fields', () => {
  const content = read(itemRoute);
  const validationContent = read(validationHelper);
  assert(content.includes('export async function PATCH'), 'PATCH handler missing');
  assert(content.includes('prisma.hydrationLog.update'), 'PATCH route must update HydrationLog records');
  assert(validationContent.includes('cupsConsumed') && validationContent.includes('cupSize'), 'PATCH route must support cupsConsumed and cupSize');
  assert(!content.includes('loggedAt: body.loggedAt'), 'PATCH route must not allow loggedAt updates');
  assert(!content.includes('userId: body.userId'), 'PATCH route must not allow userId updates');
});

test('DELETE route removes only current-day hydration logs', () => {
  const content = read(itemRoute);
  assert(content.includes('export async function DELETE'), 'DELETE handler missing');
  assert(content.includes('getCurrentDateRange'), 'DELETE route must compute current-day range');
  assert(content.includes('loggedAt < currentDay.start') && content.includes('loggedAt >= currentDay.end'), 'DELETE route must block non-current-day logs');
  assert(content.includes('prisma.hydrationLog.delete'), 'DELETE route must delete HydrationLog records');
});

test('Item routes enforce ownership and return 401/403 appropriately', () => {
  const content = read(itemRoute);
  assert(content.includes('getServerSession'), 'Item routes must read authenticated session');
  assert(content.includes('status: 401'), 'Item routes must return 401 when unauthenticated');
  assert(content.includes('status: 403'), 'Item routes must return 403 for logs owned by another user');
  assert(content.includes('log.userId !== userId') || content.includes('log.userId !== session.user.id'), 'Item routes must compare log owner to session user');
});

test('Collection route returns 401 for unauthenticated requests', () => {
  const content = read(collectionRoute);
  assert(content.includes('status: 401'), 'Collection route must return 401 when unauthenticated');
});

test('Hydration log inputs are validated as positive integers', () => {
  const collectionContent = read(collectionRoute);
  const itemContent = read(itemRoute);
  const validationContent = read(validationHelper);
  assert(collectionContent.includes('validateHydrationLogInput'), 'POST route must validate hydration input');
  assert(itemContent.includes('validateHydrationLogInput'), 'PATCH route must validate hydration input');
  assert(validationContent.includes('Number.isInteger'), 'Validation must require integer values');
  assert(validationContent.includes('value <= 0'), 'Validation must reject zero and negative values');
});

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
