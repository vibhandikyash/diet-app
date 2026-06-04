const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const files = [
  'src/lib/hydration-log-validation.ts',
  'src/app/api/hydration/logs/route.ts',
  'src/app/api/hydration/logs/[id]/route.ts',
];

let hasErrors = false;

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  const source = fs.readFileSync(fullPath, 'utf8');

  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      strict: true,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.error(`\nErrors in ${filePath}:`);
    result.diagnostics.forEach((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      console.error(`  ${message}`);
    });
    hasErrors = true;
  } else {
    console.log(`✓ ${filePath}`);
  }
});

if (!hasErrors) {
  console.log('\n✓ All files passed syntax check');
}

process.exitCode = hasErrors ? 1 : 0;
