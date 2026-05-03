import fs from 'node:fs';
import path from 'node:path';

const configPath = path.join(process.cwd(), '.vercel', 'output', 'config.json');

if (!fs.existsSync(configPath)) {
  console.error(
    '[build] Missing .vercel/output/config.json — Nitro did not emit the Vercel Build Output API bundle.\n' +
      '  Fix: BUILD_PRESET=vercel during build (Vercel) and nitro.preset "vercel" in vite.config.ts.\n' +
      '  Vercel Dashboard: Framework = Other and clear Output Directory override so .vercel/output is used.'
  );
  process.exit(1);
}

try {
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (typeof raw.version !== 'number' || raw.version < 3) {
    console.error('[build] Unexpected .vercel/output/config.json version:', raw.version);
    process.exit(1);
  }
} catch (e) {
  console.error('[build] Failed to read .vercel/output/config.json:', e?.message ?? e);
  process.exit(1);
}

console.log('[build] Vercel Build Output API present at .vercel/output/config.json');
