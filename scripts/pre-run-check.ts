import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(msg: string, color = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

async function runCheck() {
  log("=== AVALON SYSTEM PRE-RUN CHECK ===", COLORS.cyan);
  
  let hasErrors = false;

  // 1. Check Required Files
  const requiredFiles = [
    'src/main.tsx',
    'src/App.tsx',
    'src/lib/utils.ts',
    'src/services/jikanService.ts',
    'metadata.json'
  ];

  log("\n[*] Checking required files...");
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      log(`  [OK] ${file}`, COLORS.green);
    } else {
      log(`  [FAIL] ${file} is missing!`, COLORS.red);
      hasErrors = true;
    }
  }

  // 2. Check TypeScript / Lint
  log("\n[*] Running TypeScript sanity check...");
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    log("  [OK] TypeScript check passed.", COLORS.green);
  } catch (err) {
    log("  [FAIL] TypeScript errors detected.", COLORS.red);
    hasErrors = true;
  }

  // 3. Check for specific Avalon patterns
  log("\n[*] Checking Avalon brand consistency...");
  const metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf-8'));
  if (metadata.name !== 'Avalon') {
    log(`  [WARN] App name in metadata.json is '${metadata.name}', expected 'Avalon'.`, COLORS.yellow);
  } else {
    log("  [OK] Metadata name matches Avalon.", COLORS.green);
  }

  if (hasErrors) {
    log("\n[!] CRITICAL ERRORS DETECTED. FIX BEFORE RUNNING.", COLORS.red);
    process.exit(1);
  } else {
    log("\n[SUCCESS] All systems operational. Launching Avalon...", COLORS.green);
  }
}

runCheck().catch(err => {
  console.error(err);
  process.exit(1);
});
