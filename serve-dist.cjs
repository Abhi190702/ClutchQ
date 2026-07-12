const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'client', 'dist');
const configuredPort = Number(process.env.FRONTEND_PORT || 5173);
const port = Number.isInteger(configuredPort) && configuredPort > 0 && configuredPort <= 65535 ? configuredPort : 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8'
};

const baseHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const isInsideRoot = (file) => {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const sendFile = (req, res, file, statusCode = 200) => {
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, baseHeaders);
      res.end('Not found');
      return;
    }

    const extension = path.extname(file).toLowerCase();
    const immutable = file.includes(`${path.sep}assets${path.sep}`);
    res.writeHead(statusCode, {
      ...baseHeaders,
      'Content-Type': types[extension] || 'application/octet-stream',
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache'
    });
    if (req.method === 'HEAD') res.end();
    else res.end(data);
  });
};

http
  .createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { ...baseHeaders, Allow: 'GET, HEAD' });
      res.end('Method not allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      res.writeHead(400, baseHeaders);
      res.end('Bad request');
      return;
    }

    const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
    const file = path.resolve(root, requestedPath);
    if (!isInsideRoot(file)) {
      res.writeHead(403, baseHeaders);
      res.end('Forbidden');
      return;
    }

    fs.stat(file, (error, stats) => {
      if (!error && stats.isFile()) {
        sendFile(req, res, file);
        return;
      }

      if (!path.extname(requestedPath)) {
        sendFile(req, res, path.join(root, 'index.html'));
        return;
      }

      res.writeHead(404, baseHeaders);
      res.end('Not found');
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`ClutchQ frontend running on http://localhost:${port}`));
