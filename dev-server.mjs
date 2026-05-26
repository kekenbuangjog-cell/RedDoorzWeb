import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 8000);

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

function resolvePath(urlPath) {
    const cleanPath = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const filePath = resolve(join(root, cleanPath === '/' ? 'index.html' : cleanPath));
    return filePath.startsWith(root) ? filePath : null;
}

createServer((req, res) => {
    const filePath = resolvePath(req.url || '/');
    if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
    }

    res.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
}).listen(port, '127.0.0.1', () => {
    console.log(`Serving RedDoorz at http://127.0.0.1:${port}/`);
});
