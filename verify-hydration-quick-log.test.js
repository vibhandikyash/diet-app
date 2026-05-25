/**
 * Verification tests for the quick hydration logging UI.
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

test('QuickHydrationLog component exists as a client component', () => {
  assert(
    fs.existsSync('src/components/QuickHydrationLog.tsx'),
    'src/components/QuickHydrationLog.tsx not found'
  );

  const content = read('src/components/QuickHydrationLog.tsx');
  assert(content.includes('"use client"') || content.includes("'use client'"), 'QuickHydrationLog must be a client component');
});

test('QuickHydrationLog displays preset 8oz, 12oz, and 16oz buttons', () => {
  const content = read('src/components/QuickHydrationLog.tsx');

  for (const amount of ['8', '12', '16']) {
    assert(content.includes(`${amount}oz`), `QuickHydrationLog missing ${amount}oz preset button`);
  }
});

test('QuickHydrationLog posts selected cup size immediately to hydration logs API', () => {
  const content = read('src/components/QuickHydrationLog.tsx');

  assert(content.includes("fetch('/api/hydration/logs'") || content.includes('fetch("/api/hydration/logs"'), 'QuickHydrationLog should post to /api/hydration/logs');
  assert(content.includes('method: "POST"') || content.includes("method: 'POST'"), 'QuickHydrationLog should use POST for log creation');
  assert(content.includes('cupsConsumed: 1'), 'QuickHydrationLog should immediately log one consumed cup per tap');
  assert(content.includes('cupSize'), 'QuickHydrationLog should submit the selected cup size');
});

test('QuickHydrationLog supports custom non-standard quantities', () => {
  const content = read('src/components/QuickHydrationLog.tsx');

  assert(content.includes('customAmount'), 'QuickHydrationLog should track a custom amount');
  assert(content.includes('type="number"'), 'QuickHydrationLog should provide numeric custom entry');
  assert(content.includes('Log custom'), 'QuickHydrationLog should include a custom submit action');
});

test('QuickHydrationLog updates today log list immediately after submission', () => {
  const content = read('src/components/QuickHydrationLog.tsx');

  assert(content.includes('todayLogs'), 'QuickHydrationLog should maintain today log entries');
  assert(content.includes('setTodayLogs'), 'QuickHydrationLog should update today logs after create');
  assert(content.includes('[createdLog') || content.includes('[data.log'), 'QuickHydrationLog should prepend or append the created log without waiting for navigation');
  assert(content.includes("Today's water log"), 'QuickHydrationLog should render today log list');
});

test('QuickHydrationLog renders loading, success, and error feedback', () => {
  const content = read('src/components/QuickHydrationLog.tsx');

  assert(content.includes('isLogging'), 'QuickHydrationLog should track log creation loading state');
  assert(content.includes('Logging') || content.includes('Saving'), 'QuickHydrationLog should display loading feedback');
  assert(content.includes('errorMessage'), 'QuickHydrationLog should track error feedback');
  assert(content.includes('Logged') || content.includes('Added'), 'QuickHydrationLog should show visual confirmation after success');
});

test('Dashboard includes the quick hydration logger for frequent daily use', () => {
  const content = read('src/app/dashboard/page.tsx');

  assert(content.includes('QuickHydrationLog'), 'Dashboard should render QuickHydrationLog');
});

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}
