/**
 * Verification tests for the daily hydration goal page UI.
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

const componentPath = 'src/components/HydrationGoalForm.tsx';
const goalsPagePath = 'src/app/goals/page.tsx';
const dashboardPath = 'src/app/dashboard/page.tsx';

test('HydrationGoalForm exists as a client component', () => {
  assert(fs.existsSync(componentPath), 'src/components/HydrationGoalForm.tsx not found');

  const content = read(componentPath);
  assert(content.includes('"use client"') || content.includes("'use client'"), 'HydrationGoalForm must be a client component');
});

test('HydrationGoalForm loads and displays the current goal or initial goal prompt', () => {
  const content = read(componentPath);

  assert(content.includes("fetch('/api/hydration/goal'") || content.includes('fetch("/api/hydration/goal"'), 'HydrationGoalForm should load /api/hydration/goal');
  assert(content.includes('currentGoal'), 'HydrationGoalForm should track the current goal');
  assert(content.includes('Current goal'), 'HydrationGoalForm should display an existing current goal');
  assert(content.includes('Set your first daily water goal'), 'HydrationGoalForm should prompt when no goal exists');
});

test('HydrationGoalForm validates daily target cups between 1 and 30', () => {
  const content = read(componentPath);

  assert(content.includes('type="number"'), 'HydrationGoalForm should use numeric input');
  assert(content.includes('min="1"'), 'HydrationGoalForm should set min=1');
  assert(content.includes('max="30"'), 'HydrationGoalForm should set max=30');
  assert(content.includes('dailyTargetCups < 1') || content.includes('targetCups < 1'), 'HydrationGoalForm should reject targets below 1');
  assert(content.includes('dailyTargetCups > 30') || content.includes('targetCups > 30'), 'HydrationGoalForm should reject targets above 30');
});

test('HydrationGoalForm creates or updates the goal and updates UI immediately', () => {
  const content = read(componentPath);

  assert(content.includes('method: currentGoal ? "PATCH" : "POST"') || content.includes("method: currentGoal ? 'PATCH' : 'POST'"), 'HydrationGoalForm should POST new goals and PATCH existing goals');
  assert(content.includes('setCurrentGoal'), 'HydrationGoalForm should update the displayed goal after save');
  assert(content.includes('successMessage'), 'HydrationGoalForm should show save confirmation');
  assert(content.includes('Goal saved'), 'HydrationGoalForm should include success confirmation copy');
});

test('HydrationGoalForm displays clear guidance and errors', () => {
  const content = read(componentPath);

  assert(content.includes('8 to 12 cups'), 'HydrationGoalForm should include recommended daily intake guidance');
  assert(content.includes('errorMessage'), 'HydrationGoalForm should track error feedback');
  assert(content.includes('Unable to save') || content.includes('Unable to load'), 'HydrationGoalForm should display network failure feedback');
  assert(content.includes('aria-live="polite"'), 'HydrationGoalForm should expose status updates accessibly');
  assert(content.includes('aria-live="assertive"'), 'HydrationGoalForm should expose errors accessibly');
});

test('Goals page renders the hydration goal form', () => {
  const content = read(goalsPagePath);

  assert(content.includes('HydrationGoalForm'), 'Goals page should render HydrationGoalForm');
  assert(content.includes('Daily hydration goal'), 'Goals page should identify the hydration goal section');
});

test('Dashboard links to the hydration goal page', () => {
  const content = read(dashboardPath);

  assert(content.includes('href="/goals"'), 'Dashboard should link to /goals');
  assert(content.includes('Set hydration goal') || content.includes('Update hydration goal'), 'Dashboard should provide hydration goal navigation copy');
});

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}
