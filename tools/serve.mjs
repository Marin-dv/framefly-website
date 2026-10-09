// Tiny static file server. Usage: node serve.mjs <dir> <port>
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2]);
const port = Number(process.argv[3] || 5310);
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".woff2": "font/woff2", ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    let file = path.join(root, p);
    // like GitHub Pages: /articles/name answers with articles/name.html
    if (!path.extname(file) && fs.existsSync(file + ".html")) file += ".html";
    if (!file.startsWith(root)) return res.writeHead(403).end();
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        const nf = path.join(root, "404.html");
        if (fs.existsSync(nf) && !path.extname(p).match(/\.(js|css|png|jpg|webp|mp4|json|svg|woff2)$/)) {
          res.writeHead(404, { "content-type": types[".html"] });
          return fs.createReadStream(nf).pipe(res);
        }
        return res.writeHead(404).end("not found");
      }
      const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m[1] ? Number(m[1]) : 0;
        const end = m[2] ? Number(m[2]) : st.size - 1;
        res.writeHead(206, { "content-type": type, "content-range": `bytes ${start}-${end}/${st.size}`, "accept-ranges": "bytes", "content-length": end - start + 1, "cache-control": "no-store" });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { "content-type": type, "content-length": st.size, "accept-ranges": "bytes", "cache-control": "no-store" });
      fs.createReadStream(file).pipe(res);
    });
  })
  .listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
