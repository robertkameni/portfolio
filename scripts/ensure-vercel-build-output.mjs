import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = path.resolve(process.cwd());
const OUTPUT_DIR = path.resolve(ROOT_DIR, '.vercel', 'output');
const configPath = path.resolve(OUTPUT_DIR, 'config.json');
const staticDir = path.resolve(OUTPUT_DIR, 'static');

function assertWithinOutput(targetPath) {
  const resolved = path.resolve(targetPath);
  const outputPrefix = OUTPUT_DIR.endsWith(path.sep) ? OUTPUT_DIR : `${OUTPUT_DIR}${path.sep}`;
  if (resolved !== OUTPUT_DIR && !resolved.startsWith(outputPrefix)) {
    throw new Error(`Refusing to touch path outside .vercel/output: ${resolved}`);
  }
  return resolved;
}

assertWithinOutput(configPath);
assertWithinOutput(staticDir);

// ── 1. Validate config.json exists and has a supported version ────────────────

if (!fs.existsSync(configPath)) {
  console.error(
    '[build] Missing .vercel/output/config.json — Nitro did not emit the Vercel Build Output API bundle.\n' +
      '  Fix: BUILD_PRESET=vercel during build (Vercel) and nitro.preset "vercel" in vite.config.ts.\n' +
      '  Vercel Dashboard: Framework = Other and clear Output Directory override so .vercel/output is used.',
  );
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (typeof config.version !== 'number' || config.version < 3) {
    console.error('[build] Unexpected .vercel/output/config.json version:', config.version);
    process.exit(1);
  }
} catch (e) {
  console.error('[build] Failed to read .vercel/output/config.json:', e?.message ?? e);
  process.exit(1);
}

console.log('[build] Vercel Build Output API present at .vercel/output/config.json');

// ── 2. Collect SHA-256 hashes from every inline <script> in static HTML ───────

function sha256Base64(content) {
  return crypto.createHash('sha256').update(content).digest('base64');
}

function isUnsafeEntryName(name) {
  return name === '..' || name.includes('\0');
}

function pushHtmlFile(files, entry, fullPath) {
  if (!entry.isFile()) {
    return;
  }
  if (!entry.name.endsWith('.html')) {
    return;
  }
  files.push(fullPath);
}

function appendHtmlEntry(files, entry, parentDir) {
  if (isUnsafeEntryName(entry.name)) {
    return;
  }

  const fullPath = assertWithinOutput(path.resolve(parentDir, entry.name));
  if (entry.isDirectory()) {
    files.push(...collectHtmlFiles(fullPath));
    return;
  }

  pushHtmlFile(files, entry, fullPath);
}

function collectHtmlFiles(dir) {
  const safeDir = assertWithinOutput(dir);
  if (!fs.existsSync(safeDir)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(safeDir, { withFileTypes: true })) {
    appendHtmlEntry(files, entry, safeDir);
  }
  return files;
}

const htmlFiles = collectHtmlFiles(staticDir);
const inlineHashes = new Set();
const inlineScriptPattern = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;

for (const file of htmlFiles) {
  const content = fs.readFileSync(assertWithinOutput(file), 'utf8');
  let match;
  while ((match = inlineScriptPattern.exec(content)) !== null) {
    const body = match[1];
    if (body && body.trim().length > 0) {
      inlineHashes.add(`'sha256-${sha256Base64(body)}'`);
    }
  }
  inlineScriptPattern.lastIndex = 0;
}

console.log(`[build] Detected ${inlineHashes.size} inline script hash(es) across ${htmlFiles.length} HTML file(s).`);

// ── 3. Inject current hashes into the CSP header inside config.json ───────────

if (inlineHashes.size > 0) {
  const hashFragment = [...inlineHashes].join(' ');
  const routes = config.routes ?? [];
  let patched = false;

  for (const route of routes) {
    const headers = route.headers ?? {};
    const cspKey = Object.keys(headers).find((k) => k.toLowerCase() === 'content-security-policy');
    const reportOnlyKey = Object.keys(headers).find((k) => k.toLowerCase() === 'content-security-policy-report-only');

    if (cspKey) {
      headers[cspKey] = headers[cspKey]
        .replace(/'sha256-[A-Za-z0-9+/=]+'\s*/g, '')
        .replace(/script-src([^;]*)/, (_, rest) => `script-src${rest.trimEnd()} ${hashFragment}`);
    }

    if (reportOnlyKey) {
      headers[reportOnlyKey] = headers[reportOnlyKey]
        .replace(/'sha256-[A-Za-z0-9+/=]+'\s*/g, '')
        .replace(/script-src([^;]*)/, (_, rest) => `script-src${rest.trimEnd()} ${hashFragment}`);
    }

    if (cspKey || reportOnlyKey) {
      patched = true;
    }
  }

  if (patched) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log('[build] CSP hashes injected into .vercel/output/config.json');
  } else {
    console.warn('[build] No Content-Security-Policy header found in config.json routes — hashes not injected.');
  }
}
