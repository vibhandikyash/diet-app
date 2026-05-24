/**
 * Quick verification that all required files exist
 */

const fs = require('fs');

const requiredFiles = [
  'package.json',
  'prisma/schema.prisma',
  'src/lib/auth.ts',
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/auth/signup/route.ts',
  'src/app/signup/page.tsx',
  'src/app/login/page.tsx',
  'src/app/dashboard/page.tsx',
  'middleware.ts',
  'src/types/next-auth.d.ts',
  'src/components/SessionProvider.tsx',
  '.env.example',
];

console.log('Verifying NextAuth implementation...\n');

let allExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allExist = false;
});

console.log('\n' + '='.repeat(50));

if (allExist) {
  console.log('✓ All required files exist!');
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npx prisma migrate dev --name add_user_password');
  console.log('3. Run: npm run test:auth');
  process.exit(0);
} else {
  console.log('✗ Some files are missing!');
  process.exit(1);
}
