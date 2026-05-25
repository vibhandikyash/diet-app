/**
 * Verification tests for the seven-day hydration history view.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

function loadHistoryModule() {
  const filePath = path.join(process.cwd(), 'src/lib/hydration-history.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const exportedNames = [];
  const withoutTypeAliases = source.replace(/export type [\s\S]+?;\n/g, '');
  const withoutExports = withoutTypeAliases.replace(/export function (\w+)/g, (_match, name) => {
    exportedNames.push(name);
    return `function ${name}`;
  });
  const compiled = withoutExports
    .replace(/date: Date/g, 'date')
    .replace(/currentDate: Date/g, 'currentDate')
    .replace(/totalCups: number/g, 'totalCups')
    .replace(/dailyTargetCups: number \| null \| undefined/g, 'dailyTargetCups')
    .replace(/\): Date/g, ')')
    .replace(/\): string\[]/g, ')')
    .replace(/\): string/g, ')')
    .replace(/\): \{ status: 'achieved' \| 'partial' \| 'missed'; tone: 'green' \| 'yellow' \| 'red'; label: string \}/g, ')') +
    `\nmodule.exports = { ${exportedNames.join(', ')} };\n`;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    console,
    Date,
  };

  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return module.exports;
}

test('History page renders the hydration history calendar', () => {
  const page = read('src/app/history/page.tsx');

  assert(page.includes('HydrationHistoryCalendar'), 'History page should render HydrationHistoryCalendar');
});

test('Seven-day window contains 7 consecutive dates ending with the provided current date', () => {
  assert(fs.existsSync('src/lib/hydration-history.ts'), 'src/lib/hydration-history.ts not found');

  const { getSevenDayHydrationWindow } = loadHistoryModule();
  const days = getSevenDayHydrationWindow(new Date('2026-05-25T21:30:00.000Z'));

  assert(days.length === 7, `Expected 7 days, got ${days.length}`);
  assert(days[0] === '2026-05-19', `Expected first day 2026-05-19, got ${days[0]}`);
  assert(days[6] === '2026-05-25', `Expected final day 2026-05-25, got ${days[6]}`);
});

test('Hydration status maps goal progress to green, yellow, and red states', () => {
  const { getHydrationStatus } = loadHistoryModule();

  assert(getHydrationStatus(8, 8).tone === 'green', 'Expected 100% of goal to be green');
  assert(getHydrationStatus(4, 8).tone === 'yellow', 'Expected 50% of goal to be yellow');
  assert(getHydrationStatus(3, 8).tone === 'red', 'Expected less than 50% of goal to be red');
});

test('HydrationHistoryCalendar fetches summaries for the seven-day range and current goal', () => {
  assert(fs.existsSync('src/components/HydrationHistoryCalendar.tsx'), 'src/components/HydrationHistoryCalendar.tsx not found');

  const component = read('src/components/HydrationHistoryCalendar.tsx');

  assert(component.includes('"use client"') || component.includes("'use client'"), 'HydrationHistoryCalendar must be a client component');
  assert(component.includes('/api/hydration/summary?'), 'Calendar should fetch hydration summaries');
  assert(component.includes('startDate=') && component.includes('endDate='), 'Calendar should request the seven-day summary range');
  assert(component.includes('/api/hydration/goal'), 'Calendar should fetch the current daily goal');
});

test('Each calendar day displays total cups, daily goal, and color-coded indicators', () => {
  const component = read('src/components/HydrationHistoryCalendar.tsx');

  assert(component.includes('totalCups'), 'Calendar should display daily total cups');
  assert(component.includes('dailyTargetCups'), 'Calendar should display the daily hydration goal');
  assert(component.includes('bg-green') || component.includes('text-green'), 'Calendar should include green achieved styling');
  assert(component.includes('bg-yellow') || component.includes('text-yellow'), 'Calendar should include yellow partial styling');
  assert(component.includes('bg-red') || component.includes('text-red'), 'Calendar should include red missed styling');
});

test('Clicking a day loads and displays detailed hydration logs for that date', () => {
  const component = read('src/components/HydrationHistoryCalendar.tsx');

  assert(component.includes('selectedDate'), 'Calendar should track selectedDate');
  assert(component.includes('/api/hydration/logs?date='), 'Calendar should fetch detailed logs by selected date');
  assert(component.includes('setDetailedLogs'), 'Calendar should store detailed log entries');
  assert(component.includes('onClick'), 'Calendar days should be clickable');
});

test('Calendar refreshes its seven-day range when the current date changes', () => {
  const component = read('src/components/HydrationHistoryCalendar.tsx');

  assert(component.includes('todayKey'), 'Calendar should track the current date key');
  assert(component.includes('setInterval'), 'Calendar should periodically detect a date change');
  assert(component.includes('getSevenDayHydrationWindow'), 'Calendar should derive the range from the current date');
});

test('Configured test runner includes hydration history verification', () => {
  const pkg = JSON.parse(read('package.json'));

  assert(
    pkg.scripts.test.includes('verify-hydration-history.test.js'),
    'npm test should include verify-hydration-history.test.js'
  );
});

console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}
