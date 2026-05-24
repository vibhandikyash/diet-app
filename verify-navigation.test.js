/**
 * Verification tests for base layout with navigation
 * These tests verify the acceptance criteria for the navigation layout ticket
 */

const fs = require('fs');
const path = require('path');

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

// Test 1: Navigation component exists
test('Navigation component file exists', () => {
  assert(
    fs.existsSync('src/components/Navigation.tsx'),
    'src/components/Navigation.tsx not found'
  );
});

test('Navigation component exports default', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('export default') || content.includes('export { Navigation as default }'),
    'Navigation component does not export default'
  );
});

// Test 2: Logo and app name in navigation
test('Navigation displays app name/logo', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('Diet App') || content.includes('DietApp'),
    'Navigation does not display app name'
  );
});

// Test 3: Required navigation links
test('Navigation includes Dashboard link', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('/dashboard') && content.includes('Dashboard'),
    'Navigation does not include Dashboard link'
  );
});

test('Navigation includes Meals link', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('/meals') && content.includes('Meals'),
    'Navigation does not include Meals link'
  );
});

test('Navigation includes Foods link', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('/foods') && content.includes('Foods'),
    'Navigation does not include Foods link'
  );
});

test('Navigation includes Goals link', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('/goals') && content.includes('Goals'),
    'Navigation does not include Goals link'
  );
});

test('Navigation includes History link', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('/history') && content.includes('History'),
    'Navigation does not include History link'
  );
});

// Test 4: Logout functionality
test('Navigation includes logout button', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('signOut') || content.includes('logout') || content.includes('Logout') || content.includes('Sign out'),
    'Navigation does not include logout functionality'
  );
});

test('Navigation imports signOut from next-auth', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('from "next-auth/react"') && content.includes('signOut'),
    'Navigation does not import signOut from next-auth/react'
  );
});

// Test 5: Mobile responsive menu
test('Navigation has mobile menu toggle (hamburger)', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  const hasMobileMenu =
    (content.includes('useState') && (content.includes('Menu') || content.includes('mobile') || content.includes('open'))) ||
    content.includes('hamburger') ||
    (content.includes('md:') && content.includes('hidden'));
  assert(
    hasMobileMenu,
    'Navigation does not have mobile menu toggle functionality'
  );
});

// Test 6: Active route highlighting
test('Navigation tracks active route', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  assert(
    content.includes('usePathname') || content.includes('pathname') || content.includes('active'),
    'Navigation does not track active route'
  );
});

test('Navigation applies active styling', () => {
  const content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
  const hasActiveStyle =
    content.includes('pathname') && (
      content.includes('bg-') ||
      content.includes('text-') ||
      content.includes('font-')
    );
  assert(
    hasActiveStyle,
    'Navigation does not apply visual styling for active route'
  );
});

// Test 7: AppLayout component for authenticated pages
test('AppLayout component file exists', () => {
  assert(
    fs.existsSync('src/components/AppLayout.tsx'),
    'src/components/AppLayout.tsx not found'
  );
});

test('AppLayout uses Navigation component', () => {
  const content = fs.readFileSync('src/components/AppLayout.tsx', 'utf8');
  assert(
    content.includes('Navigation') || content.includes('<nav') || content.includes('navbar'),
    'AppLayout does not include Navigation component'
  );
});

// Test 8: Protected pages exist
test('Dashboard page exists', () => {
  assert(
    fs.existsSync('src/app/dashboard/page.tsx'),
    'Dashboard page does not exist'
  );
});

test('Meals page exists', () => {
  assert(
    fs.existsSync('src/app/meals/page.tsx'),
    'Meals page does not exist'
  );
});

test('Foods page exists', () => {
  assert(
    fs.existsSync('src/app/foods/page.tsx'),
    'Foods page does not exist'
  );
});

test('Goals page exists', () => {
  assert(
    fs.existsSync('src/app/goals/page.tsx'),
    'Goals page does not exist'
  );
});

test('History page exists', () => {
  assert(
    fs.existsSync('src/app/history/page.tsx'),
    'History page does not exist'
  );
});

// Test 9: Middleware protects all authenticated routes
test('Middleware protects authenticated routes', () => {
  const content = fs.readFileSync('middleware.ts', 'utf8');
  const protectsMultipleRoutes =
    content.includes('/dashboard') ||
    (content.includes('matcher') && (
      content.includes('*') ||
      content.includes('/meals') ||
      content.includes('/foods') ||
      content.includes('/goals') ||
      content.includes('/history')
    ));
  assert(
    protectsMultipleRoutes,
    'Middleware does not protect all authenticated routes'
  );
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
