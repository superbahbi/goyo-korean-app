// Minimal zero-dependency static file server for self-hosting the built app.
// Deployment on Vercel serves dist/public statically; this server exists for
// environments that want to run the production build directly with `node`.
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const staticPath = path.resolve(__dirname, "..", "dist", "public");

function sendFile(res: import("http").ServerResponse, filePath: string) {
  void readFile(filePath)
    .then((data) => {
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
      });
      res.end(data);
    })
    .catch(() => {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
    });
}

async function startServer() {
  const port = Number(process.env.PORT) || 3000;

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const requestPath = decodeURIComponent(url.pathname);
    const resolved = path.normalize(path.join(staticPath, requestPath));

    // Prevent path traversal outside the static root.
    if (!resolved.startsWith(staticPath)) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    void stat(resolved)
      .then((info) => {
        if (info.isDirectory()) {
          sendFile(res, path.join(resolved, "index.html"));
        } else {
          sendFile(res, resolved);
        }
      })
      .catch(() => {
        // Client-side routing fallback: serve index.html for all routes.
        sendFile(res, path.join(staticPath, "index.html"));
      });
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
