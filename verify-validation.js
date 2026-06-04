const fs = require('fs');
const path = require('path');
const ts = require('typescript');

// Load and compile the validation module
const validationPath = path.join(process.cwd(), 'src/lib/hydration-log-validation.ts');
const validationSource = fs.readFileSync(validationPath, 'utf8');
const validationCompiled = ts.transpileModule(validationSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const module = { exports: {} };
const vm = require('vm');
const sandbox = {
  module,
  exports: module.exports,
  require,
  console,
};

vm.runInNewContext(validationCompiled, sandbox);
const { validateHydrationAmount } = module.exports;

console.log('Testing validateHydrationAmount...\n');

// Test cases
const tests = [
  { input: 0, field: 'cupsConsumed', expectError: true, description: 'zero' },
  { input: -5, field: 'cupsConsumed', expectError: true, description: 'negative' },
  { input: 1, field: 'cupsConsumed', expectError: false, description: 'positive integer' },
  { input: 10, field: 'cupSize', expectError: false, description: 'positive integer' },
  { input: 0, field: 'cupSize', expectError: true, description: 'zero cupSize' },
  { input: 1.5, field: 'cupsConsumed', expectError: true, description: 'decimal' },
  { input: 'abc', field: 'cupsConsumed', expectError: true, description: 'string' },
];

let passed = 0;
let failed = 0;

tests.forEach(({ input, field, expectError, description }) => {
  const result = validateHydrationAmount(input, field);
  const hasError = result !== null;

  if (hasError === expectError) {
    console.log(`✓ ${description}: ${input} - ${expectError ? 'correctly rejected' : 'correctly accepted'}`);
    if (hasError) {
      console.log(`  Error: ${result.message}`);
    }
    passed++;
  } else {
    console.log(`✗ ${description}: ${input} - expected ${expectError ? 'error' : 'success'}, got ${hasError ? 'error' : 'success'}`);
    if (result) {
      console.log(`  Error: ${result.message}`);
    }
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
