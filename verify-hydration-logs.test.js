/**
 * Verification tests for hydration log CRUD API routes.
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

function createJsonResponse(body, init = {}) {
  return {
    status: init.status || 200,
    body,
    async json() {
      return body;
    },
  };
}

function createRequest(url, { method = 'GET', userId = 'user-1', body } = {}) {
  return {
    method,
    url,
    headers: {
      get(name) {
        return name.toLowerCase() === 'x-user-id' ? userId : null;
      },
    },
    async json() {
      return body || {};
    },
  };
}

function loadRoute(routePath, fakePrisma) {
  const filePath = path.join(process.cwd(), routePath);
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
      if (request === 'next/server') {
        return { NextResponse: { json: createJsonResponse } };
      }
      if (request === '@/lib/prisma') {
        return { prisma: fakePrisma };
      }
      if (request === '@/lib/hydration-api') {
        return {
          getHydrationRequestUserId: async (request) => request.headers.get('x-user-id'),
          parsePositiveInt: (value) => {
            const parsed = typeof value === 'number' ? value : Number(value);
            return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
          },
        };
      }
      if (request === '@/lib/hydration-summary') {
        return {
          calculateDailyHydrationSummary: async (userId, date) => ({
            id: 'summary-1',
            userId,
            date,
            totalCups: 0,
          }),
          normalizeHydrationDate: (date) => {
            const parsed = new Date(date);
            return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
          },
        };
      }
      return require(request);
    },
    console,
    Date,
    URL,
  };

  vm.runInNewContext(compiled, sandbox, { filename: filePath });
  return module.exports;
}

test('POST /api/hydration/logs creates a user-owned log with an auto-generated timestamp', async () => {
  const calls = [];
  const fakePrisma = {
    hydrationLog: {
      create: async (args) => {
        calls.push({ method: 'create', args });
        return { id: 'log-1', ...args.data };
      },
    },
  };
  const { POST } = loadRoute('src/app/api/hydration/logs/route.ts', fakePrisma);

  const before = Date.now();
  const response = await POST(createRequest('http://test.local/api/hydration/logs', {
    method: 'POST',
    body: { cupsConsumed: 2, cupSize: 12 },
  }));
  const after = Date.now();
  const json = await response.json();

  assert(response.status === 201, `Expected status 201, got ${response.status}`);
  assert(calls[0].args.data.userId === 'user-1', 'Expected created log to be scoped to authenticated user');
  assert(calls[0].args.data.cupsConsumed === 2, 'Expected cupsConsumed to be persisted');
  assert(calls[0].args.data.cupSize === 12, 'Expected cupSize to be persisted');
  assert(calls[0].args.data.loggedAt instanceof Date, 'Expected loggedAt to be generated as a Date');
  assert(calls[0].args.data.loggedAt.getTime() >= before, 'Expected loggedAt to be generated at request time');
  assert(calls[0].args.data.loggedAt.getTime() <= after, 'Expected loggedAt to be generated at request time');
  assert(json.log.id === 'log-1', 'Expected created log in response');
});

test('GET /api/hydration/logs?date=YYYY-MM-DD lists only the authenticated user day', async () => {
  const calls = [];
  const fakePrisma = {
    hydrationLog: {
      findMany: async (args) => {
        calls.push({ method: 'findMany', args });
        return [{ id: 'log-1', userId: 'user-1', cupsConsumed: 2, cupSize: 12 }];
      },
    },
  };
  const { GET } = loadRoute('src/app/api/hydration/logs/route.ts', fakePrisma);

  assert(typeof GET === 'function', 'Expected logs route to export GET');
  const response = await GET(createRequest('http://test.local/api/hydration/logs?date=2026-05-25'));
  const json = await response.json();

  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(Array.isArray(json.logs) && json.logs.length === 1, 'Expected logs array in response');
  assert(calls[0].args.where.userId === 'user-1', 'Expected query to enforce authenticated user ownership');
  assert(
    calls[0].args.where.loggedAt.gte.toISOString() === '2026-05-25T00:00:00.000Z',
    'Expected GET date range to start at UTC midnight'
  );
  assert(
    calls[0].args.where.loggedAt.lt.toISOString() === '2026-05-26T00:00:00.000Z',
    'Expected GET date range to end before next UTC midnight'
  );
});

test('PATCH /api/hydration/logs/:id partially updates an owned log', async () => {
  const calls = [];
  const existingLog = {
    id: 'log-1',
    userId: 'user-1',
    cupsConsumed: 1,
    cupSize: 8,
    loggedAt: new Date('2026-05-25T12:00:00.000Z'),
  };
  const fakePrisma = {
    hydrationLog: {
      findUnique: async (args) => {
        calls.push({ method: 'findUnique', args });
        return existingLog;
      },
      update: async (args) => {
        calls.push({ method: 'update', args });
        return { ...existingLog, ...args.data };
      },
    },
  };
  const { PATCH } = loadRoute('src/app/api/hydration/logs/[id]/route.ts', fakePrisma);

  assert(typeof PATCH === 'function', 'Expected log detail route to export PATCH');
  const response = await PATCH(
    createRequest('http://test.local/api/hydration/logs/log-1', {
      method: 'PATCH',
      body: { cupsConsumed: 3 },
    }),
    { params: { id: 'log-1' } }
  );
  const updateCall = calls.find((call) => call.method === 'update');

  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(updateCall.args.where.id === 'log-1', 'Expected update by id');
  assert(updateCall.args.data.cupsConsumed === 3, 'Expected cupsConsumed to be updated');
  assert(!Object.prototype.hasOwnProperty.call(updateCall.args.data, 'cupSize'), 'Expected omitted cupSize to remain unchanged');
});

test('PATCH /api/hydration/logs/:id returns 403 for another user log', async () => {
  const fakePrisma = {
    hydrationLog: {
      findUnique: async () => ({
        id: 'log-2',
        userId: 'user-2',
        cupsConsumed: 1,
        cupSize: 8,
        loggedAt: new Date('2026-05-25T12:00:00.000Z'),
      }),
      update: async () => {
        throw new Error('update should not be called for another user log');
      },
    },
  };
  const { PATCH } = loadRoute('src/app/api/hydration/logs/[id]/route.ts', fakePrisma);

  const response = await PATCH(
    createRequest('http://test.local/api/hydration/logs/log-2', {
      method: 'PATCH',
      body: { cupSize: 16 },
    }),
    { params: { id: 'log-2' } }
  );

  assert(response.status === 403, `Expected status 403, got ${response.status}`);
});

test('DELETE /api/hydration/logs/:id removes only current-day owned logs', async () => {
  const calls = [];
  const fakePrisma = {
    hydrationLog: {
      findUnique: async (args) => {
        calls.push({ method: 'findUnique', args });
        return {
          id: args.where.id,
          userId: 'user-1',
          cupsConsumed: 1,
          cupSize: 8,
          loggedAt: new Date(),
        };
      },
      delete: async (args) => {
        calls.push({ method: 'delete', args });
        return { id: args.where.id };
      },
    },
  };
  const { DELETE } = loadRoute('src/app/api/hydration/logs/[id]/route.ts', fakePrisma);

  const response = await DELETE(
    createRequest('http://test.local/api/hydration/logs/log-1', { method: 'DELETE' }),
    { params: { id: 'log-1' } }
  );

  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(calls.some((call) => call.method === 'delete'), 'Expected owned current-day log to be deleted');
});

test('DELETE /api/hydration/logs/:id returns 403 for non-current-day logs', async () => {
  const fakePrisma = {
    hydrationLog: {
      findUnique: async () => ({
        id: 'log-1',
        userId: 'user-1',
        cupsConsumed: 1,
        cupSize: 8,
        loggedAt: new Date('2000-01-01T12:00:00.000Z'),
      }),
      delete: async () => {
        throw new Error('delete should not be called for a non-current-day log');
      },
    },
  };
  const { DELETE } = loadRoute('src/app/api/hydration/logs/[id]/route.ts', fakePrisma);

  const response = await DELETE(
    createRequest('http://test.local/api/hydration/logs/log-1', { method: 'DELETE' }),
    { params: { id: 'log-1' } }
  );

  assert(response.status === 403, `Expected status 403, got ${response.status}`);
});

process.on('beforeExit', () => {
  console.log('\n' + '='.repeat(50));
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('='.repeat(50));

  process.exitCode = testsFailed > 0 ? 1 : 0;
});
