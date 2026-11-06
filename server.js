#!/usr/bin/env node
"use strict";

/*
 * WebMap micro-server — tanpa dependency (hanya built-in Node.js).
 *
 *   STATIC  : serve file dari folder proyek + gzip + ETag/cache header.
 *   API     : GET /api/health, /api/locations, /api/kpi, /api/monitor
 *   LIVE    : GET /api/stream (Server-Sent Events) untuk sinyal real-time.
 *
 * Jalankan:  PORT=8000 node server.js
 * Env     :  PORT, HOST (default semua interface), CORS_ORIGIN (default *)
 * Data    :  data/locations.json, data/kpi.json, data/monitor.json
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = __dirname;
const PORT_ENV = Number(process.env.PORT);
const PORT = Number.isInteger(PORT_ENV) && PORT_ENV >= 0 && PORT_ENV < 65536 ? PORT_ENV : 8000;
const HOST = process.env.HOST || undefined;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const MAX_CLIENTS = 200;
const COMPRESSIBLE = /^(text\/|application\/(json|javascript)|image\/svg|image\/x-icon)/;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};

/* ---------- Data (dibaca dari folder data/, bisa diedit tanpa restart) ---------- */

const DATA_DIR = path.join(ROOT, "data");
const MONITOR_EMPTY = { stats: [], signals: [], sectors: [], chokepoints: [], markets: [] };
const warned = new Set();

function loadJSON(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
  } catch (e) {
    if (!warned.has(name)) {
      warned.add(name);
      console.warn("data/" + name + " tidak terbaca (" + e.code + "), pakai nilai kosong");
    }
    return fallback;
  }
}

const clients = new Set();
const LIVE = { value: 62 };

function nextLive() {
  LIVE.value += (Math.random() - 0.48) * 8;
  LIVE.value = Math.max(20, Math.min(100, LIVE.value));
  return Math.round(LIVE.value * 10) / 10;
}

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": CORS_ORIGIN
  });
  res.end(body);
}

function toSafePath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch (e) {
    return null;
  }
  const full = path.normalize(path.join(ROOT, decoded));
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) return null;
  return full;
}

function serveStatic(req, res, pathname) {
  const full = toSafePath(pathname);
  if (!full) return sendJSON(res, 400, { error: "path tidak valid" });

  fs.stat(full, (statErr, st) => {
    if (statErr || !st.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
      return res.end("404 — file tidak ditemukan");
    }

    const etag = '"' + st.mtimeMs.toString(36) + "-" + st.size.toString(36) + '"';
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { ETag: etag });
      return res.end();
    }

    const type = MIME[path.extname(full).toLowerCase()] || "application/octet-stream";
    const isHead = req.method === "HEAD";
    const acceptGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const headers = {
      "Content-Type": type,
      "Cache-Control": path.extname(full) === ".html" ? "no-cache" : "public, max-age=600",
      "X-Content-Type-Options": "nosniff",
      ETag: etag
    };

    const gzip = acceptGzip && COMPRESSIBLE.test(type);
    if (COMPRESSIBLE.test(type)) headers.Vary = "Accept-Encoding";
    if (gzip) headers["Content-Encoding"] = "gzip";
    else headers["Content-Length"] = st.size;
    res.writeHead(200, headers);
    if (isHead) return res.end();

    const stream = fs.createReadStream(full);
    const fail = function () { res.destroy(); };
    stream.on("error", fail);
    res.on("close", () => stream.destroy());
    if (gzip) {
      const gz = zlib.createGzip();
      gz.on("error", fail);
      stream.pipe(gz).pipe(res);
    } else {
      stream.pipe(res);
    }
  });
}

function handleSSE(req, res) {
  if (clients.size >= MAX_CLIENTS) return sendJSON(res, 503, { error: "terlalu banyak koneksi" });
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": CORS_ORIGIN
  });
  res.write("retry: 3000\n\n");
  res.write("data: " + JSON.stringify({ t: Date.now(), value: nextLive() }) + "\n\n");
  clients.add(res);
  req.on("close", function () {
    clients.delete(res);
    res.end();
  });
}

setInterval(function () {
  if (!clients.size) return;
  const payload = "data: " + JSON.stringify({ t: Date.now(), value: nextLive() }) + "\n\n";
  clients.forEach(function (c) {
    try {
      c.write(payload);
    } catch (e) {
      clients.delete(c);
    }
  });
}, 2000);

function route(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch (e) {
    return sendJSON(res, 400, { error: "URL tidak valid" });
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJSON(res, 405, { error: "metode tidak diizinkan" });
  }

  const p = url.pathname;
  const now = new Date().toISOString();

  if (p === "/config.js" && process.env.CARTO_APIKEY) {
    res.writeHead(200, {
      "Content-Type": MIME[".js"],
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    return res.end("window.WEBMAP_CONFIG = { cartoKey: " + JSON.stringify(process.env.CARTO_APIKEY.trim()) + " };\n");
  }
  if (p === "/api/health") {
    return sendJSON(res, 200, {
      status: "ok",
      uptime: Math.round(process.uptime()),
      clients: clients.size,
      ts: now
    });
  }
  if (p === "/api/locations") {
    const locations = loadJSON("locations.json", []);
    return sendJSON(res, 200, {
      source: "webmap-server",
      updated: now,
      total: locations.length,
      locations: locations
    });
  }
  if (p === "/api/kpi") {
    return sendJSON(res, 200, {
      source: "webmap-server",
      updated: now,
      kpi: loadJSON("kpi.json", {})
    });
  }
  if (p === "/api/monitor") {
    const m = loadJSON("monitor.json", MONITOR_EMPTY);
    return sendJSON(res, 200, {
      source: "webmap-server",
      updated: now,
      stats: m.stats || [],
      signals: m.signals || [],
      sectors: m.sectors || [],
      chokepoints: m.chokepoints || [],
      markets: m.markets || []
    });
  }
  if (p === "/api/stream") {
    return handleSSE(req, res);
  }
  if (p.startsWith("/api/")) {
    return sendJSON(res, 404, { error: "endpoint tidak dikenal" });
  }

  let pathname = p;
  if (pathname === "/") pathname = "/index.html";
  return serveStatic(req, res, pathname);
}

const server = http.createServer(route);

server.on("error", function (err) {
  console.error("Server gagal start: " + err.code + " — " + err.message);
  process.exit(1);
});

server.listen(PORT, HOST, function () {
  const port = server.address().port;
  console.log("WebMap server aktif → http://localhost:" + port);
  console.log("  API  : /api/health /api/locations /api/kpi /api/monitor");
  console.log("  LIVE : /api/stream (SSE)");
});

function shutdown() {
  clients.forEach(function (c) {
    try { c.end(); } catch (e) {}
  });
  server.close(function () { process.exit(0); });
  setTimeout(function () { process.exit(0); }, 3000).unref();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
