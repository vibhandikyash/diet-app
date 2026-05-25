/**
 * Verification tests for daily hydration summary calculations and API integration.
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

function loadHydrationSummaryModule(fakePrisma) {
  const filePath = path.join(process.cwd(), 'src/lib/hydration-summary.ts');
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
      return require(request);
    },
    console,
  };

  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return module.exports;
}

function createFakePrisma({ logCups, dailyTargetCups }) {
  const calls = [];
  const fakePrisma = {
    hydrationLog: {
      aggregate: async (args) => {
        calls.push({ model: 'hydrationLog', method: 'aggregate', args });
        return { _sum: { cupsConsumed: logCups } };
      },
      findUnique: async (args) => {
        calls.push({ model: 'hydrationLog', method: 'findUnique', args });
        return {
          id: args.where.id,
          userId: 'user-1',
          cupsConsumed: 2,
          loggedAt: new Date('2026-05-25T16:00:00.000Z'),
        };
      },
    },
    hydrationGoal: {
      findFirst: async (args) => {
        calls.push({ model: 'hydrationGoal', method: 'findFirst', args });
        return dailyTargetCups == null ? null : { id: 'goal-1', dailyTargetCups };
      },
    },
    dailyHydrationSummary: {
      upsert: async (args) => {
        calls.push({ model: 'dailyHydrationSummary', method: 'upsert', args });
        return {
          id: 'summary-1',
          ...args.create,
          ...args.update,
        };
      },
      findMany: async (args) => {
        calls.push({ model: 'dailyHydrationSummary', method: 'findMany', args });
        return [
          {
            id: 'summary-1',
            userId: 'user-1',
            date: new Date('2026-05-25T00:00:00.000Z'),
            totalCups: 8,
            goalAchieved: true,
          },
        ];
      },
    },
  };

  return { fakePrisma, calls };
}

test('DailyHydrationSummary.goalAchieved is nullable for users without goals', () => {
  const schema = read('prisma/schema.prisma');
  const model = schema.match(/model DailyHydrationSummary\s*{[^}]+}/s)?.[0] || '';

  assert(model.includes('goalAchieved Boolean?'), 'goalAchieved should be nullable Boolean?');
  assert(!model.includes('goalAchieved Boolean  @default(false)'), 'goalAchieved should not default to false');
});

test('calculateDailyHydrationSummary sums a user day and stores goal status', async () => {
  const { fakePrisma, calls } = createFakePrisma({ logCups: 9, dailyTargetCups: 8 });
  const { calculateDailyHydrationSummary } = loadHydrationSummaryModule(fakePrisma);

  const summary = await calculateDailyHydrationSummary(
    'user-1',
    new Date('2026-05-25T13:45:00.000Z')
  );

  assert(summary.totalCups === 9, `Expected totalCups 9, got ${summary.totalCups}`);
  assert(summary.goalAchieved === true, 'Expected goalAchieved true when actual >= target');

  const aggregateCall = calls.find((call) => call.model === 'hydrationLog' && call.method === 'aggregate');
  assert(aggregateCall, 'Expected hydrationLog.aggregate to be called');
  assert(
    aggregateCall.args.where.loggedAt.gte.toISOString() === '2026-05-25T00:00:00.000Z',
    'Expected day range to start at UTC midnight'
  );
  assert(
    aggregateCall.args.where.loggedAt.lt.toISOString() === '2026-05-26T00:00:00.000Z',
    'Expected day range to end before next UTC midnight'
  );

  const upsertCall = calls.find((call) => call.model === 'dailyHydrationSummary' && call.method === 'upsert');
  assert(upsertCall, 'Expected dailyHydrationSummary.upsert to be called');
  assert(upsertCall.args.create.totalCups === 9, 'Expected upsert create totalCups to match sum');
  assert(upsertCall.args.update.goalAchieved === true, 'Expected upsert update goalAchieved to be true');
});

test('calculateDailyHydrationSummary stores goalAchieved null when no goal exists', async () => {
  const { fakePrisma } = createFakePrisma({ logCups: 4, dailyTargetCups: null });
  const { calculateDailyHydrationSummary } = loadHydrationSummaryModule(fakePrisma);

  const summary = await calculateDailyHydrationSummary('user-1', new Date('2026-05-25T08:00:00.000Z'));

  assert(summary.totalCups === 4, `Expected totalCups 4, got ${summary.totalCups}`);
  assert(summary.goalAchieved === null, `Expected goalAchieved null, got ${summary.goalAchieved}`);
});

test('listDailyHydrationSummaries queries a user date range inclusively by day', async () => {
  const { fakePrisma, calls } = createFakePrisma({ logCups: 8, dailyTargetCups: 8 });
  const { listDailyHydrationSummaries } = loadHydrationSummaryModule(fakePrisma);

  const summaries = await listDailyHydrationSummaries(
    'user-1',
    '2026-05-20',
    '2026-05-25'
  );

  assert(summaries.length === 1, 'Expected summaries to be returned');

  const findManyCall = calls.find((call) => call.model === 'dailyHydrationSummary' && call.method === 'findMany');
  assert(findManyCall, 'Expected dailyHydrationSummary.findMany to be called');
  assert(findManyCall.args.where.userId === 'user-1', 'Expected summaries to be scoped to user');
  assert(
    findManyCall.args.where.date.gte.toISOString() === '2026-05-20T00:00:00.000Z',
    'Expected inclusive start date normalized to UTC midnight'
  );
  assert(
    findManyCall.args.where.date.lte.toISOString() === '2026-05-25T00:00:00.000Z',
    'Expected inclusive end date normalized to UTC midnight'
  );
});

test('Hydration API routes wire logs and summaries to the calculation service', () => {
  const summaryRoute = read('src/app/api/hydration/summary/route.ts');
  const logsRoute = read('src/app/api/hydration/logs/route.ts');
  const logRoute = read('src/app/api/hydration/logs/[id]/route.ts');

  assert(summaryRoute.includes('listDailyHydrationSummaries'), 'Summary GET route should use listDailyHydrationSummaries');
  assert(summaryRoute.includes('startDate') && summaryRoute.includes('endDate'), 'Summary GET route should read startDate and endDate');
  assert(logsRoute.includes('calculateDailyHydrationSummary'), 'Log create route should refresh the daily summary');
  assert(logRoute.includes('calculateDailyHydrationSummary'), 'Log update/delete route should refresh affected summaries');
  assert(logRoute.includes('DELETE'), 'Log route should support DELETE refreshes');
});

process.on('beforeExit', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('='.repeat(50));

  process.exitCode = testsFailed > 0 ? 1 : 0;
});
