/**
 * Verification tests for the seven-day hydration history view.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`✓ ${name}`);
      testsPassed++;
    })
    .catch((error) => {
      console.error(`✗ ${name}`);
      console.error(`  ${error.message}`);
      testsFailed++;
    });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(filePath) {
  return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
}

function loadHydrationHistoryModule(fakePrisma) {
  const filePath = path.join(process.cwd(), 'src/lib/hydration-history.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require: (request) => {
      if (request === '@/lib/prisma') {
        return { prisma: fakePrisma };
      }
      if (request === '@/lib/hydration-summary') {
        return require(path.join(process.cwd(), 'src/lib/hydration-summary.ts'));
      }
      return require(request);
    },
    console,
  };

  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return module.exports;
}

function createFakePrisma() {
  const calls = [];
  const fakePrisma = {
    dailyHydrationSummary: {
      findMany: async (args) => {
        calls.push({ model: 'dailyHydrationSummary', method: 'findMany', args });
        return [
          {
            id: 'summary-1',
            userId: 'user-1',
            date: new Date('2026-05-19T00:00:00.000Z'),
            totalCups: 8,
            goalAchieved: true,
          },
          {
            id: 'summary-2',
            userId: 'user-1',
            date: new Date('2026-05-20T00:00:00.000Z'),
            totalCups: 6,
            goalAchieved: false,
          },
          {
            id: 'summary-3',
            userId: 'user-1',
            date: new Date('2026-05-21T00:00:00.000Z'),
            totalCups: 3,
            goalAchieved: false,
          },
        ];
      },
    },
    hydrationGoal: {
      findFirst: async (args) => {
        calls.push({ model: 'hydrationGoal', method: 'findFirst', args });
        return { id: 'goal-1', userId: 'user-1', dailyTargetCups: 8 };
      },
    },
    hydrationLog: {
      findMany: async (args) => {
        calls.push({ model: 'hydrationLog', method: 'findMany', args });
        return [
          {
            id: 'log-1',
            userId: 'user-1',
            cupsConsumed: 2,
            cupSize: 12,
            loggedAt: new Date('2026-05-25T09:00:00.000Z'),
          },
          {
            id: 'log-2',
            userId: 'user-1',
            cupsConsumed: 1,
            cupSize: 8,
            loggedAt: new Date('2026-05-25T13:30:00.000Z'),
          },
        ];
      },
    },
  };

  return { fakePrisma, calls };
}

test('buildSevenDayHydrationHistory returns seven consecutive days ending today', async () => {
  const { fakePrisma, calls } = createFakePrisma();
  const { buildSevenDayHydrationHistory } = loadHydrationHistoryModule(fakePrisma);

  const days = await buildSevenDayHydrationHistory(
    'user-1',
    new Date('2026-05-25T17:45:00.000Z')
  );

  assert(days.length === 7, `Expected 7 days, got ${days.length}`);
  assert(days[0].date === '2026-05-19', `Expected first date 2026-05-19, got ${days[0].date}`);
  assert(days[6].date === '2026-05-25', `Expected final date 2026-05-25, got ${days[6].date}`);
  assert(days.every((day) => day.dailyGoalCups === 8), 'Expected each day to include the daily goal');

  const findManyCall = calls.find((call) => call.model === 'dailyHydrationSummary');
  assert(findManyCall.args.where.date.gte.toISOString() === '2026-05-19T00:00:00.000Z', 'Expected range start to move with today');
  assert(findManyCall.args.where.date.lte.toISOString() === '2026-05-25T00:00:00.000Z', 'Expected range end to be today');
});

test('buildSevenDayHydrationHistory assigns color-coded goal status thresholds', async () => {
  const { fakePrisma } = createFakePrisma();
  const { buildSevenDayHydrationHistory } = loadHydrationHistoryModule(fakePrisma);

  const days = await buildSevenDayHydrationHistory('user-1', '2026-05-25');
  const achieved = days.find((day) => day.date === '2026-05-19');
  const partial = days.find((day) => day.date === '2026-05-20');
  const missed = days.find((day) => day.date === '2026-05-21');

  assert(achieved.indicator === 'green', `Expected achieved day green, got ${achieved.indicator}`);
  assert(achieved.goalStatus === 'achieved', `Expected achieved status, got ${achieved.goalStatus}`);
  assert(partial.indicator === 'yellow', `Expected partial day yellow, got ${partial.indicator}`);
  assert(partial.goalStatus === 'partial', `Expected partial status, got ${partial.goalStatus}`);
  assert(missed.indicator === 'red', `Expected missed day red, got ${missed.indicator}`);
  assert(missed.goalStatus === 'missed', `Expected missed status, got ${missed.goalStatus}`);
});

test('listHydrationLogsForDate queries detailed entries for a selected date', async () => {
  const { fakePrisma, calls } = createFakePrisma();
  const { listHydrationLogsForDate } = loadHydrationHistoryModule(fakePrisma);

  const logs = await listHydrationLogsForDate('user-1', '2026-05-25');

  assert(logs.length === 2, `Expected 2 logs, got ${logs.length}`);
  assert(logs[0].loggedAt === '2026-05-25T09:00:00.000Z', 'Expected logs to serialize loggedAt as ISO strings');

  const findManyCall = calls.find((call) => call.model === 'hydrationLog');
  assert(findManyCall.args.where.userId === 'user-1', 'Expected log query to be scoped to the user');
  assert(findManyCall.args.where.loggedAt.gte.toISOString() === '2026-05-25T00:00:00.000Z', 'Expected selected day start');
  assert(findManyCall.args.where.loggedAt.lt.toISOString() === '2026-05-26T00:00:00.000Z', 'Expected selected day end');
  assert(findManyCall.args.orderBy.loggedAt === 'asc', 'Expected logs ordered by time');
});

test('History page renders a weekly calendar and clickable day details', () => {
  const page = read('src/app/history/page.tsx');
  const logsRoute = read('src/app/api/hydration/logs/route.ts');
  const packageJson = JSON.parse(read('package.json'));

  assert(page.includes('HydrationHistoryView'), 'History page should render the hydration history component');
  assert(read('src/components/HydrationHistoryView.tsx').includes('onClick'), 'Day cells should be clickable');
  assert(read('src/components/HydrationHistoryView.tsx').includes('/api/hydration/history'), 'Component should fetch the seven-day history API');
  assert(read('src/components/HydrationHistoryView.tsx').includes('/api/hydration/logs?date='), 'Component should fetch detailed logs for the selected date');
  assert(logsRoute.includes('export async function GET'), 'Hydration logs route should support reading logs by date');
  assert(
    packageJson.scripts.test.includes('verify-hydration-history.test.js'),
    'npm test should include hydration history verification'
  );
});

process.on('beforeExit', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('='.repeat(50));

  process.exitCode = testsFailed > 0 ? 1 : 0;
});
