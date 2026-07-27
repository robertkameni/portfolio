import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ASSETS_DIR = path.resolve('dist/client/assets');
const STATS_PATH = path.resolve('dist/bundle-budget-report.json');

/** Fail CI if the largest entry chunk exceeds this gzip size. */
const MAIN_CHUNK_GZIP_MAX_BYTES = 200 * 1024;
/** Fail CI if any lazy/route chunk exceeds this gzip size. */
const ROUTE_CHUNK_GZIP_MAX_BYTES = 100 * 1024;

function gzipSizeBytes(content) {
  return zlib.gzipSync(content).length;
}

function collectJsFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`[bundles] Missing assets directory: ${dir}`);
    console.error('[bundles] Run "npm run build" before checking bundle budgets.');
    process.exit(1);
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => {
      const filePath = path.join(dir, name);
      const raw = fs.readFileSync(filePath);
      return {
        name,
        rawBytes: raw.length,
        gzipBytes: gzipSizeBytes(raw),
      };
    })
    .sort((a, b) => b.gzipBytes - a.gzipBytes);
}

function isRouteChunk(name) {
  return (
    name.includes('.page-') ||
    name.includes('index.page-') ||
    name.includes('projects.page-') ||
    name.includes('messages.page-') ||
    name.includes('chat-widget-') ||
    name.includes('marked.esm-')
  );
}

function isMainEntryChunk(name) {
  return /^index-[A-Za-z0-9_-]+\.js$/.test(name) || name.startsWith('_debug_node-chunk-') || name.startsWith('_module-chunk-');
}

const files = collectJsFiles(ASSETS_DIR);
const violations = [];

for (const file of files) {
  if (isMainEntryChunk(file.name) && file.gzipBytes > MAIN_CHUNK_GZIP_MAX_BYTES) {
    violations.push(
      `${file.name}: ${formatKb(file.gzipBytes)} gzip exceeds main budget ${formatKb(MAIN_CHUNK_GZIP_MAX_BYTES)}`,
    );
  }

  if (isRouteChunk(file.name) && file.gzipBytes > ROUTE_CHUNK_GZIP_MAX_BYTES) {
    violations.push(
      `${file.name}: ${formatKb(file.gzipBytes)} gzip exceeds route budget ${formatKb(ROUTE_CHUNK_GZIP_MAX_BYTES)}`,
    );
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  budgets: {
    mainChunkGzipMaxBytes: MAIN_CHUNK_GZIP_MAX_BYTES,
    routeChunkGzipMaxBytes: ROUTE_CHUNK_GZIP_MAX_BYTES,
  },
  topByGzip: files.slice(0, 15).map(({ name, rawBytes, gzipBytes }) => ({ name, rawBytes, gzipBytes })),
  violations,
};

fs.mkdirSync(path.dirname(STATS_PATH), { recursive: true });
fs.writeFileSync(STATS_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('[bundles] Top gzip sizes:');
for (const entry of report.topByGzip.slice(0, 8)) {
  console.log(`  ${entry.name}: ${formatKb(entry.gzipBytes)} gzip (${formatKb(entry.rawBytes)} raw)`);
}

console.log(`[bundles] Report written to ${path.relative(process.cwd(), STATS_PATH)}`);

if (violations.length > 0) {
  console.error('[bundles] Budget violations:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log('[bundles] All bundle size budgets passed.');

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}
