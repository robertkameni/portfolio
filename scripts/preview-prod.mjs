// Throwaway local runner for the built Vercel output: serves static files and
// hands everything else to the Nitro SSR function, so a production build can be
// measured with the real browser pipeline (hydration, hashed bundles, fonts).
//
// It also mirrors the two edge behaviours that change the numbers: Brotli on
// text responses and the immutable cache headers from vercel.json.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const root = process.cwd();
const staticDir = join(root, '.vercel/output/static');
const entry = join(root, '.vercel/output/functions/__fallback.func/index.mjs');
// Vercel injects this global (`file:///_entry.js`); outside Vercel the bundled
// Prisma client needs a real path.
const entryUrl = pathToFileURL(entry).href;
globalThis._importMeta_ = { url: entryUrl };
const { default: handler } = await import(entryUrl);

const types = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

const compressible = new Set(['.js', '.mjs', '.css', '.svg', '.json', '.txt', '.xml']);

function wantsBrotli(req) {
  return /\bbr\b/.test(String(req.headers['accept-encoding'] ?? ''));
}

function brotli(buf) {
  return brotliCompressSync(buf, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 5, [constants.BROTLI_PARAM_SIZE_HINT]: buf.length },
  });
}

const cacheControlFor = (pathname) => {
  if (/^\/(assets|fonts)\//.test(pathname)) return 'public, max-age=31536000, immutable';
  return 'no-cache';
};

/** Buffer the SSR response so the HTML is compressed like Vercel does. */
function bufferAndCompress(req, res) {
  if (!wantsBrotli(req)) return;
  const chunks = [];
  let pending = null;
  const rawWriteHead = res.writeHead.bind(res);
  const rawWrite = res.write.bind(res);
  const rawEnd = res.end.bind(res);

  res.writeHead = (status, headers) => {
    pending = { status, headers: headers ?? {} };
    return res;
  };
  res.write = (chunk, encoding, callback) => {
    if (chunk) chunks.push(Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8'));
    const done = typeof encoding === 'function' ? encoding : callback;
    if (done) done();
    return true;
  };
  res.end = (chunk, encoding, callback) => {
    if (chunk && typeof chunk !== 'function') {
      chunks.push(Buffer.from(chunk, typeof encoding === 'string' ? encoding : 'utf8'));
    }
    const done = typeof chunk === 'function' ? chunk : typeof encoding === 'function' ? encoding : callback;
    const body = Buffer.concat(chunks);
    const headers = { ...res.getHeaders(), ...(pending?.headers ?? {}) };
    if (!headers['content-type']) headers['content-type'] = 'text/html; charset=utf-8';
    if (body.length > 1024) {
      const packed = brotli(body);
      headers['content-encoding'] = 'br';
      headers['content-length'] = packed.length;
      rawWriteHead(pending?.status ?? 200, headers);
      rawWrite(packed);
    } else {
      headers['content-length'] = body.length;
      rawWriteHead(pending?.status ?? 200, headers);
      rawWrite(body);
    }
    rawEnd();
    if (done) done();
  };
  res.flushHeaders = () => {};
}

const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const isFile = extname(pathname) !== '' && pathname !== '/index.html';
    const file = join(staticDir, pathname);

    if (isFile && file.startsWith(staticDir) && existsSync(file) && statSync(file).isFile()) {
      let body = await readFile(file);
      const type = types[extname(file)] ?? 'application/octet-stream';
      const headers = { 'content-type': type, 'cache-control': cacheControlFor(pathname) };
      if (compressible.has(extname(file)) && wantsBrotli(req)) {
        body = brotli(body);
        headers['content-encoding'] = 'br';
      }
      headers['content-length'] = body.length;
      res.writeHead(200, headers);
      res.end(body);
      return;
    }

    bufferAndCompress(req, res);
    handler(req, res);
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(error?.stack ?? error));
  }
});

const port = Number(process.env.PORT ?? 4100);
server.listen(port, () => console.log(`preview on http://localhost:${port}`));
