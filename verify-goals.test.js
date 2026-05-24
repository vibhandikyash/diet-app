/**
 * Verification tests for user goal setting interface
 * These tests verify the acceptance criteria for the goal setting ticket
 */

const fs = require('fs');
const path = require('path');

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

// Test 1: Prisma schema has goalType field
test('UserGoal model has goalType field', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const userGoalModel = schema.match(/model UserGoal\s*{[^}]+}/s)?.[0] || '';
  assert(
    userGoalModel.includes('goalType'),
    'UserGoal model missing goalType field'
  );
});

test('UserGoal goalType field is String type', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const userGoalModel = schema.match(/model UserGoal\s*{[^}]+}/s)?.[0] || '';
  assert(
    /goalType\s+String/.test(userGoalModel),
    'UserGoal goalType field is not String type'
  );
});

// Test 2: Goals API route exists
test('Goals API route exists', () => {
  const routeExists = fs.existsSync('src/app/api/goals/route.ts') ||
                      fs.existsSync('app/api/goals/route.ts');
  assert(routeExists, 'Goals API route not found at /api/goals/route.ts');
});

test('Goals API exports GET handler', () => {
  const routePath = fs.existsSync('src/app/api/goals/route.ts')
    ? 'src/app/api/goals/route.ts'
    : 'app/api/goals/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('export') && content.includes('GET'),
      'Goals API route missing exported GET handler'
    );
  }
});

test('Goals API exports POST handler', () => {
  const routePath = fs.existsSync('src/app/api/goals/route.ts')
    ? 'src/app/api/goals/route.ts'
    : 'app/api/goals/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('export') && content.includes('POST'),
      'Goals API route missing exported POST handler'
    );
  }
});

test('Goals API validates positive numbers', () => {
  const routePath = fs.existsSync('src/app/api/goals/route.ts')
    ? 'src/app/api/goals/route.ts'
    : 'app/api/goals/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('> 0') || content.includes('>0') || content.includes('positive'),
      'Goals API does not validate positive numbers'
    );
  }
});

// Test 3: Goals page has form inputs
test('Goals page exists and is not placeholder', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  assert(fs.existsSync(pagePath), 'Goals page not found');

  const content = fs.readFileSync(pagePath, 'utf8');
  assert(
    !content.includes('Set and track your nutrition goals here'),
    'Goals page is still a placeholder'
  );
});

test('Goals page has calorie input', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('calorie') || content.includes('Calorie')) && content.includes('input'),
      'Goals page missing calorie input'
    );
  }
});

test('Goals page has protein input', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('protein') || content.includes('Protein')) && content.includes('input'),
      'Goals page missing protein input'
    );
  }
});

test('Goals page has carbs input', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('carb') || content.includes('Carb')) && content.includes('input'),
      'Goals page missing carbs input'
    );
  }
});

test('Goals page has fats input', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('fat') || content.includes('Fat')) && content.includes('input'),
      'Goals page missing fats input'
    );
  }
});

test('Goals page has goal type dropdown', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('goalType') || content.includes('goal type')) && content.includes('select'),
      'Goals page missing goal type dropdown'
    );
  }
});

test('Goals page has weight loss option', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      content.includes('weight loss') || content.includes('Weight Loss') || content.includes('WEIGHT_LOSS'),
      'Goals page missing weight loss option'
    );
  }
});

test('Goals page has maintenance option', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      content.includes('maintenance') || content.includes('Maintenance') || content.includes('MAINTENANCE'),
      'Goals page missing maintenance option'
    );
  }
});

test('Goals page has muscle gain option', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      content.includes('muscle gain') || content.includes('Muscle Gain') || content.includes('MUSCLE_GAIN'),
      'Goals page missing muscle gain option'
    );
  }
});

test('Goals page loads data on mount', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('useEffect') || content.includes('fetch')) && content.includes('/api/goals'),
      'Goals page does not load data from API'
    );
  }
});

test('Goals page validates input ranges', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      content.includes('min=') || content.includes('max=') || content.includes('validation'),
      'Goals page does not validate input ranges'
    );
  }
});

test('Goals page has save/submit button', () => {
  const pagePath = fs.existsSync('src/app/goals/page.tsx')
    ? 'src/app/goals/page.tsx'
    : 'app/goals/page.tsx';

  if (fs.existsSync(pagePath)) {
    const content = fs.readFileSync(pagePath, 'utf8');
    assert(
      (content.includes('button') && (content.includes('Save') || content.includes('Submit'))) ||
      content.includes('onSubmit'),
      'Goals page missing save/submit button'
    );
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
