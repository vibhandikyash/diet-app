/**
 * Verification tests for Next.js 15 setup
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

test('package.json has Next.js 15 dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.next, 'Next.js not found in dependencies');
  const nextVersion = pkg.dependencies.next.replace(/[\^~]/, '');
  const majorVersion = parseInt(nextVersion.split('.')[0]);
  assert(majorVersion === 15, `Next.js version is ${nextVersion}, expected 15.x`);
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

test('package.json has shadcn/ui runtime dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.['class-variance-authority'], 'class-variance-authority not found in dependencies');
  assert(pkg.dependencies?.clsx, 'clsx not found in dependencies');
  assert(pkg.dependencies?.['tailwind-merge'], 'tailwind-merge not found in dependencies');
  assert(pkg.dependencies?.['lucide-react'], 'lucide-react not found in dependencies');
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

test('Tailwind CSS has shadcn theme colors configured', () => {
  const configPath = fs.existsSync('tailwind.config.ts') ? 'tailwind.config.ts' : 'tailwind.config.js';
  const content = fs.readFileSync(configPath, 'utf8');
  assert(content.includes('darkMode'), 'Tailwind darkMode not configured for shadcn/ui');
  assert(content.includes('background: "hsl(var(--background))"'), 'background theme color not configured');
  assert(content.includes('primary:') && content.includes('"hsl(var(--primary))"'), 'primary theme color not configured');
  assert(content.includes('destructive:') && content.includes('"hsl(var(--destructive))"'), 'destructive theme color not configured');
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

test('globals.css defines shadcn theme CSS variables', () => {
  const content = fs.readFileSync('src/app/globals.css', 'utf8');
  assert(content.includes('--background:'), 'missing --background CSS variable');
  assert(content.includes('--primary:'), 'missing --primary CSS variable');
  assert(content.includes('--destructive:'), 'missing --destructive CSS variable');
  assert(content.includes('--radius:'), 'missing --radius CSS variable');
});

// Test 4: shadcn/ui structure
test('components.json exists for shadcn/ui', () => {
  assert(fs.existsSync('components.json'), 'components.json not found');
});

test('shadcn/ui Button and Card components exist', () => {
  assert(fs.existsSync('src/components/ui/button.tsx'), 'Button component not found');
  assert(fs.existsSync('src/components/ui/card.tsx'), 'Card component not found');
});

test('lib utility helper exists for shadcn/ui components', () => {
  const content = fs.readFileSync('src/lib/utils.ts', 'utf8');
  assert(content.includes('clsx'), 'utils.ts does not use clsx');
  assert(content.includes('twMerge'), 'utils.ts does not use tailwind-merge');
});

// Test 5: App Router structure
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

// Test 6: ESLint configuration
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

// Test 7: next.config file exists
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
