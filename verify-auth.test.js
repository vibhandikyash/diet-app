/**
 * Verification tests for NextAuth email/password authentication
 * These tests verify the acceptance criteria for the authentication ticket
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

// Test 1: Dependencies installed
test('package.json has next-auth dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.['next-auth'], 'next-auth not found in dependencies');
});

test('package.json has bcryptjs dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.dependencies?.['bcryptjs'], 'bcryptjs not found in dependencies');
});

test('package.json has @types/bcryptjs dependency', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert(pkg.devDependencies?.['@types/bcryptjs'], '@types/bcryptjs not found in devDependencies');
});

// Test 2: Prisma schema has password field
test('User model has password field', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const userModel = schema.match(/model User\s*{[^}]+}/s)?.[0] || '';
  assert(
    userModel.includes('password'),
    'User model missing password field'
  );
});

test('User model password field is String type', () => {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const userModel = schema.match(/model User\s*{[^}]+}/s)?.[0] || '';
  assert(
    /password\s+String/.test(userModel),
    'User model password field is not String type'
  );
});

// Test 3: NextAuth configuration exists
test('NextAuth API route exists', () => {
  const routeExists = fs.existsSync('src/app/api/auth/[...nextauth]/route.ts') ||
                      fs.existsSync('app/api/auth/[...nextauth]/route.ts');
  assert(routeExists, 'NextAuth API route not found at api/auth/[...nextauth]/route.ts');
});

test('NextAuth configuration exports handlers', () => {
  const routePath = fs.existsSync('src/app/api/auth/[...nextauth]/route.ts')
    ? 'src/app/api/auth/[...nextauth]/route.ts'
    : 'app/api/auth/[...nextauth]/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('export') && (content.includes('GET') || content.includes('POST')),
      'NextAuth route missing exported GET/POST handlers'
    );
  }
});

test('NextAuth configuration uses CredentialsProvider', () => {
  const routePath = fs.existsSync('src/app/api/auth/[...nextauth]/route.ts')
    ? 'src/app/api/auth/[...nextauth]/route.ts'
    : 'app/api/auth/[...nextauth]/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('CredentialsProvider') || content.includes('Credentials'),
      'NextAuth configuration missing CredentialsProvider'
    );
  }
});

// Test 4: Signup functionality
test('Signup page exists', () => {
  const signupExists = fs.existsSync('src/app/signup/page.tsx') ||
                       fs.existsSync('app/signup/page.tsx');
  assert(signupExists, 'Signup page not found at /signup/page.tsx');
});

test('Signup API route exists', () => {
  const apiExists = fs.existsSync('src/app/api/auth/signup/route.ts') ||
                    fs.existsSync('app/api/auth/signup/route.ts');
  assert(apiExists, 'Signup API route not found at /api/auth/signup/route.ts');
});

test('Signup API uses bcrypt for password hashing', () => {
  const apiPath = fs.existsSync('src/app/api/auth/signup/route.ts')
    ? 'src/app/api/auth/signup/route.ts'
    : 'app/api/auth/signup/route.ts';

  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');
    assert(
      content.includes('bcrypt') && (content.includes('hash') || content.includes('hashSync')),
      'Signup API does not use bcrypt for password hashing'
    );
  }
});

// Test 5: Login functionality
test('Login page exists', () => {
  const loginExists = fs.existsSync('src/app/login/page.tsx') ||
                      fs.existsSync('app/login/page.tsx');
  assert(loginExists, 'Login page not found at /login/page.tsx');
});

test('Login page uses signIn from next-auth', () => {
  const loginPath = fs.existsSync('src/app/login/page.tsx')
    ? 'src/app/login/page.tsx'
    : 'app/login/page.tsx';

  if (fs.existsSync(loginPath)) {
    const content = fs.readFileSync(loginPath, 'utf8');
    assert(
      content.includes('signIn') && content.includes('next-auth'),
      'Login page does not use signIn from next-auth'
    );
  }
});

// Test 6: Session management
test('Auth configuration has session strategy', () => {
  const routePath = fs.existsSync('src/app/api/auth/[...nextauth]/route.ts')
    ? 'src/app/api/auth/[...nextauth]/route.ts'
    : 'app/api/auth/[...nextauth]/route.ts';

  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      content.includes('session') && (content.includes('jwt') || content.includes('strategy')),
      'NextAuth configuration missing session strategy'
    );
  }
});

test('SessionProvider wrapper exists or auth helper exists', () => {
  // Check for auth helper functions
  const libAuthExists = fs.existsSync('src/lib/auth.ts') ||
                        fs.existsSync('src/lib/auth.js') ||
                        fs.existsSync('lib/auth.ts');

  assert(
    libAuthExists,
    'Auth helper file not found at lib/auth.ts'
  );
});

// Test 7: Protected routes
test('Middleware file exists for route protection', () => {
  const middlewareExists = fs.existsSync('middleware.ts') ||
                           fs.existsSync('middleware.js') ||
                           fs.existsSync('src/middleware.ts');
  assert(middlewareExists, 'Middleware file not found for route protection');
});

test('Middleware uses NextAuth', () => {
  const middlewarePath = fs.existsSync('middleware.ts')
    ? 'middleware.ts'
    : fs.existsSync('src/middleware.ts')
    ? 'src/middleware.ts'
    : 'middleware.js';

  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    assert(
      content.includes('auth') || content.includes('next-auth'),
      'Middleware does not use NextAuth for authentication'
    );
  }
});

test('Protected route example exists', () => {
  const dashboardExists = fs.existsSync('src/app/dashboard/page.tsx') ||
                          fs.existsSync('app/dashboard/page.tsx');
  assert(dashboardExists, 'Protected route example (dashboard) not found');
});

// Test 8: Logout functionality
test('Logout uses signOut from next-auth', () => {
  // Check dashboard or layout for signOut usage
  const dashboardPath = fs.existsSync('src/app/dashboard/page.tsx')
    ? 'src/app/dashboard/page.tsx'
    : 'app/dashboard/page.tsx';

  if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    assert(
      content.includes('signOut'),
      'Dashboard does not implement logout with signOut'
    );
  }
});

// Test 9: Environment variable setup
test('.env.example has NEXTAUTH_SECRET', () => {
  if (fs.existsSync('.env.example')) {
    const content = fs.readFileSync('.env.example', 'utf8');
    assert(
      content.includes('NEXTAUTH_SECRET'),
      '.env.example missing NEXTAUTH_SECRET'
    );
  } else {
    console.log('  ⚠ .env.example not found (optional)');
  }
});

test('.env.example has NEXTAUTH_URL', () => {
  if (fs.existsSync('.env.example')) {
    const content = fs.readFileSync('.env.example', 'utf8');
    assert(
      content.includes('NEXTAUTH_URL'),
      '.env.example missing NEXTAUTH_URL'
    );
  } else {
    console.log('  ⚠ .env.example not found (optional)');
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('='.repeat(50));

process.exit(testsFailed > 0 ? 1 : 0);
