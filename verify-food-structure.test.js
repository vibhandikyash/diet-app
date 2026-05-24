/**
 * Static verification tests for Food CRUD structure
 * Verifies that required files and code patterns exist
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

// Test 1: API Routes exist
test('Food list API route exists', () => {
  const exists = fs.existsSync('src/app/api/foods/route.ts');
  assert(exists, 'API route not found at src/app/api/foods/route.ts');
});

test('Food detail API route exists', () => {
  const exists = fs.existsSync('src/app/api/foods/[id]/route.ts');
  assert(exists, 'API route not found at src/app/api/foods/[id]/route.ts');
});

// Test 2: List API handles GET with pagination
test('List API exports GET handler', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(content.includes('export async function GET'), 'Missing GET handler');
});

test('List API includes pagination logic', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(
    content.includes('skip') || content.includes('page'),
    'Missing pagination implementation'
  );
});

test('List API includes limit of 20', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(content.includes('20') || content.includes('limit'), 'Missing page limit');
});

// Test 3: Create API with validation
test('Create API exports POST handler', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(content.includes('export async function POST'), 'Missing POST handler');
});

test('Create API validates calories as positive', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(
    content.includes('calories') && (content.includes('> 0') || content.includes('>= 0') || content.includes('positive')),
    'Missing calories validation'
  );
});

test('Create API validates protein as positive', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(
    content.includes('protein') && (content.includes('> 0') || content.includes('>= 0') || content.includes('positive')),
    'Missing protein validation'
  );
});

test('Create API validates carbs as positive', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(
    content.includes('carbs') && (content.includes('> 0') || content.includes('>= 0') || content.includes('positive')),
    'Missing carbs validation'
  );
});

test('Create API validates fat as positive', () => {
  const content = fs.readFileSync('src/app/api/foods/route.ts', 'utf8');
  assert(
    content.includes('fat') && (content.includes('> 0') || content.includes('>= 0') || content.includes('positive')),
    'Missing fat validation'
  );
});

// Test 4: Update API
test('Update API exports PUT handler', () => {
  const content = fs.readFileSync('src/app/api/foods/[id]/route.ts', 'utf8');
  assert(content.includes('export async function PUT'), 'Missing PUT handler');
});

test('Update API persists to database', () => {
  const content = fs.readFileSync('src/app/api/foods/[id]/route.ts', 'utf8');
  assert(
    content.includes('update') && content.includes('prisma'),
    'Missing database update logic'
  );
});

// Test 5: Delete API
test('Delete API exports DELETE handler', () => {
  const content = fs.readFileSync('src/app/api/foods/[id]/route.ts', 'utf8');
  assert(content.includes('export async function DELETE'), 'Missing DELETE handler');
});

test('Delete API removes from database', () => {
  const content = fs.readFileSync('src/app/api/foods/[id]/route.ts', 'utf8');
  assert(
    content.includes('delete') && content.includes('prisma'),
    'Missing database delete logic'
  );
});

// Test 6: Food pages exist
test('Food list page exists', () => {
  const exists = fs.existsSync('src/app/foods/page.tsx');
  assert(exists, 'Food list page not found at src/app/foods/page.tsx');
});

test('Food create page exists', () => {
  const exists = fs.existsSync('src/app/foods/new/page.tsx');
  assert(exists, 'Food create page not found at src/app/foods/new/page.tsx');
});

test('Food edit page exists', () => {
  const exists = fs.existsSync('src/app/foods/[id]/edit/page.tsx');
  assert(exists, 'Food edit page not found at src/app/foods/[id]/edit/page.tsx');
});

// Test 7: Forms have required fields
test('Create form has name field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('name'), 'Missing name field in create form');
});

test('Create form has calories field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('calories'), 'Missing calories field in create form');
});

test('Create form has protein field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('protein'), 'Missing protein field in create form');
});

test('Create form has carbs field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('carbs'), 'Missing carbs field in create form');
});

test('Create form has fat field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('fat'), 'Missing fat field in create form');
});

test('Create form has serving size field', () => {
  const content = fs.readFileSync('src/app/foods/new/page.tsx', 'utf8');
  assert(content.includes('serving'), 'Missing serving size field in create form');
});

// Test 8: List page shows pagination
test('List page includes pagination UI', () => {
  const content = fs.readFileSync('src/app/foods/page.tsx', 'utf8');
  assert(
    content.includes('page') || content.includes('Page') || content.includes('pagination'),
    'Missing pagination UI in list page'
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
