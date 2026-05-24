const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Next.js Initialization...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   ${error.message}\n`);
    failed++;
  }
}

// AC1: npm run dev starts development server on port 3000
test('package.json has dev script for port 3000', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts || !packageJson.scripts.dev) {
    throw new Error('dev script not found in package.json');
  }
  if (!packageJson.scripts.dev.includes('next dev')) {
    throw new Error('dev script should run "next dev"');
  }
});

// AC2: TypeScript strict mode enabled with no compilation errors
test('tsconfig.json has strict mode enabled', () => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (!tsconfig.compilerOptions || tsconfig.compilerOptions.strict !== true) {
    throw new Error('strict mode is not enabled in tsconfig.json');
  }
});

// AC3: shadcn/ui initialized with at least button, input, and card components
test('components.json exists (shadcn/ui initialized)', () => {
  if (!fs.existsSync('components.json')) {
    throw new Error('components.json not found - shadcn/ui not initialized');
  }
  const config = JSON.parse(fs.readFileSync('components.json', 'utf8'));
  if (!config.aliases || !config.aliases.components) {
    throw new Error('components.json missing required configuration');
  }
});

test('shadcn/ui button component exists', () => {
  const buttonPath = 'src/components/ui/button.tsx';
  if (!fs.existsSync(buttonPath)) {
    throw new Error(`Button component not found at ${buttonPath}`);
  }
  const content = fs.readFileSync(buttonPath, 'utf8');
  if (!content.includes('export') || !content.includes('Button')) {
    throw new Error('Button component does not export Button');
  }
});

test('shadcn/ui input component exists', () => {
  const inputPath = 'src/components/ui/input.tsx';
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input component not found at ${inputPath}`);
  }
  const content = fs.readFileSync(inputPath, 'utf8');
  if (!content.includes('export') || !content.includes('Input')) {
    throw new Error('Input component does not export Input');
  }
});

test('shadcn/ui card component exists', () => {
  const cardPath = 'src/components/ui/card.tsx';
  if (!fs.existsSync(cardPath)) {
    throw new Error(`Card component not found at ${cardPath}`);
  }
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('export') || !content.includes('Card')) {
    throw new Error('Card component does not export Card');
  }
});

// AC4: Basic app/page.tsx renders "Team Momentum" heading with Tailwind styling
test('app/page.tsx exists', () => {
  if (!fs.existsSync('src/app/page.tsx')) {
    throw new Error('src/app/page.tsx not found');
  }
});

test('app/page.tsx renders "Team Momentum" heading', () => {
  const pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
  if (!pageContent.includes('Team Momentum')) {
    throw new Error('Page does not contain "Team Momentum" text');
  }
});

test('app/page.tsx uses Tailwind styling', () => {
  const pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
  if (!pageContent.includes('className=')) {
    throw new Error('Page does not use Tailwind className styling');
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
