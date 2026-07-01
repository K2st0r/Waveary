import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createProviderApiMiddleware } from "../dist-server/server/provider-api.js";

const webRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distRoot = resolve(webRoot, "dist");
const host = process.env.WAVEARY_HOST?.trim() || "127.0.0.1";
const requestedPort = Number.parseInt(process.env.WAVEARY_PORT ?? "4173", 10);
const port = Number.isFinite(requestedPort) ? requestedPort : 4173;
const apiMiddleware = createProviderApiMiddleware();

const server = createServer((request, response) => {
  apiMiddleware(request, response, () => {
    serveStatic(request, response);
  }).catch((error) => {
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end(error instanceof Error ? error.message : "Unexpected standalone server failure.");
  });
});

server.listen(port, host, () => {
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Waveary standalone server did not expose a numeric port.");
  }

  console.log(`__WAVEARY_SERVER_READY__:${address.port}`);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

function serveStatic(request, response) {
  const requestUrl = new URL(request.url ?? "/", `http://${host}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const candidatePath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = resolvePathInsideDist(candidatePath);
  const filePath = pickExistingFilePath(resolvedPath, pathname);

  if (!filePath) {
    response.statusCode = 404;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Waveary desktop runtime could not find the requested page.");
    return;
  }

  const mimeType = MIME_TYPES[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  response.statusCode = 200;
  response.setHeader("Content-Type", mimeType);
  createReadStream(filePath).pipe(response);
}

function resolvePathInsideDist(requestPath) {
  const safePath = normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, "");
  return resolve(distRoot, `.${safePath.startsWith("/") ? safePath : `/${safePath}`}`);
}

function pickExistingFilePath(resolvedPath, pathname) {
  if (isFileInsideDist(resolvedPath)) {
    return resolvedPath;
  }

  if (!pathname.includes(".")) {
    const fallbackPath = join(distRoot, "index.html");
    if (existsSync(fallbackPath) && statSync(fallbackPath).isFile()) {
      return fallbackPath;
    }
  }

  return null;
}

function isFileInsideDist(filePath) {
  if (!filePath.startsWith(distRoot) || !existsSync(filePath)) {
    return false;
  }

  return statSync(filePath).isFile();
}

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};
