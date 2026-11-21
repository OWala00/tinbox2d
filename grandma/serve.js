import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT ?? 8001);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png' };

async function fileAt(path) {
  const info = await stat(path).catch(() => null);
  if (!info) return null;
  return info.isDirectory() ? fileAt(join(path, 'index.html')) : path;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const relative = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, '');
  let path = await fileAt(join(ROOT, relative));
  if (!path && pathname.startsWith('/grandma/routes/')) path = join(ROOT, 'grandma/routes/index.html');
  if (!path) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
  res.end(await readFile(path));
}).listen(PORT, () => console.log(`http://localhost:${PORT}/grandma/`));
