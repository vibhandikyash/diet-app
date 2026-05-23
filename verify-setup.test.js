/**
 * Verification tests for Next.js 14 setup
 * These tests verify the acceptance criteria for the initialization ticket
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

// Test 1: package.json exists and has required dependencies
test('package.json exists', () => {
  assert(fs.existsSync('package.json'), 'package.json not found');
});

test('package.json has Next.js 14+ dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.next, 'Next.js not found in dependencies');
  const nextVersion = pkg.dependencies.next.replace(/[\^~]/, '');
  const majorVersion = parseInt(nextVersion.split('.')[0]);
  assert(majorVersion >= 14, `Next.js version is ${nextVersion}, expected 14+`);
});

test('package.json has TypeScript dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.devDependencies?.typescript, 'TypeScript not found in devDependencies');
  assert(pkg.devDependencies?.['@types/node'], '@types/node not found in devDependencies');
  assert(pkg.devDependencies?.['@types/react'], '@types/react not found in devDependencies');
  assert(pkg.devDependencies?.['@types/react-dom'], '@types/react-dom not found in devDependencies');
});

test('package.json has Tailwind CSS dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.devDependencies?.tailwindcss, 'tailwindcss not found in devDependencies');
  assert(pkg.devDependencies?.postcss, 'postcss not found in devDependencies');
  assert(pkg.devDependencies?.autoprefixer, 'autoprefixer not found in devDependencies');
});

test('package.json has date-fns dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.['date-fns'], 'date-fns not found in dependencies');
});

// Test 2: TypeScript configuration
test('tsconfig.json exists', () => {
  assert(fs.existsSync('tsconfig.json'), 'tsconfig.json not found');
});

test('tsconfig.json is valid JSON', () => {
  const content = fs.readFileSync('tsconfig.json', 'utf8');
  JSON.parse(content); // Will throw if invalid
});

test('tsconfig.json has strict mode enabled', () => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  assert(
    tsconfig.compilerOptions?.strict === true,
    'TypeScript strict mode is not enabled'
  );
});

// Test 3: Tailwind CSS configuration
test('tailwind.config.ts exists', () => {
  const tsExists = fs.existsSync('tailwind.config.ts');
  const jsExists = fs.existsSync('tailwind.config.js');
  assert(tsExists || jsExists, 'tailwind.config.ts or tailwind.config.js not found');
});

test('postcss.config.js exists', () => {
  const jsExists = fs.existsSync('postcss.config.js');
  const mjsExists = fs.existsSync('postcss.config.mjs');
  assert(jsExists || mjsExists, 'postcss.config not found');
});

test('globals.css exists with Tailwind directives', () => {
  const possiblePaths = [
    'src/app/globals.css',
    'app/globals.css',
    'styles/globals.css'
  ];

  let found = false;
  let hasDirectives = false;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      found = true;
      const content = fs.readFileSync(p, 'utf8');
      hasDirectives = content.includes('@tailwind base') &&
                      content.includes('@tailwind components') &&
                      content.includes('@tailwind utilities');
      if (hasDirectives) break;
    }
  }

  assert(found, 'globals.css not found in expected locations');
  assert(hasDirectives, 'globals.css missing Tailwind directives');
});

// Test 4: App Router structure
test('App Router structure exists', () => {
  const appExists = fs.existsSync('app') || fs.existsSync('src/app');
  assert(appExists, 'app or src/app directory not found');
});

test('Root layout.tsx exists', () => {
  const layoutExists = fs.existsSync('app/layout.tsx') ||
                       fs.existsSync('src/app/layout.tsx');
  assert(layoutExists, 'app/layout.tsx not found');
});

test('Root page.tsx exists', () => {
  const pageExists = fs.existsSync('app/page.tsx') ||
                     fs.existsSync('src/app/page.tsx');
  assert(pageExists, 'app/page.tsx not found');
});

// Test 5: ESLint configuration
test('ESLint configuration exists', () => {
  const eslintExists = fs.existsSync('.eslintrc.json') ||
                       fs.existsSync('.eslintrc.js') ||
                       fs.existsSync('eslint.config.js') ||
                       fs.existsSync('eslint.config.mjs');
  assert(eslintExists, 'ESLint configuration not found');
});

test('package.json has ESLint dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.devDependencies?.eslint, 'ESLint not found in devDependencies');
  assert(pkg.devDependencies?.['eslint-config-next'], 'eslint-config-next not found in devDependencies');
});

// Test 6: next.config file exists
test('next.config file exists', () => {
  const mjsExists = fs.existsSync('next.config.mjs');
  const jsExists = fs.existsSync('next.config.js');
  const tsExists = fs.existsSync('next.config.ts');
  assert(mjsExists || jsExists || tsExists, 'next.config not found');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
