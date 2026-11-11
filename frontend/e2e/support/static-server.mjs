// Minimal statisk server för produktionsbygget (dist/) under base-href /yardage/,
// så att e2e kan köras mot en riktig service worker (ticket 08). Inga beroenden.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../dist/frontend/browser/', import.meta.url));
const base = '/yardage/';
const port = Number(process.argv[2] ?? 4280);

if (!existsSync(join(root, 'ngsw.json'))) {
  console.error(`Hittar inget produktionsbygge med service worker i ${root} — kör "npm run build" först.`);
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const isFile = (path) => existsSync(path) && statSync(path).isFile();

function resolve(urlPath) {
  const relative = normalize(decodeURIComponent(urlPath.slice(base.length))).replace(/^(\.\.[/\\])+/, '');
  const file = join(root, relative);
  // SPA-fallback: okända sökvägar får index.html (Angular-routern tar över).
  return file.startsWith(root) && isFile(file) ? file : join(root, 'index.html');
}

createServer((req, res) => {
  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
  if (!urlPath.startsWith(base)) {
    res.writeHead(302, { location: base }).end();
    return;
  }
  const file = resolve(urlPath);
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-cache',
  });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Serverar ${root} på http://localhost:${port}${base}`));
