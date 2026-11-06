#!/usr/bin/env node
"use strict";

/*
 * Menulis config.js dari environment variable CARTO_APIKEY.
 * Dipakai oleh GitHub Actions (secret), Vercel (env var), atau lokal.
 * Jangan commit config.js yang sudah berisi kunci.
 */

const fs = require("fs");
const path = require("path");

const key = (process.env.CARTO_APIKEY || "").trim();
const out = path.join(__dirname, "..", "config.js");

fs.writeFileSync(
  out,
  "window.WEBMAP_CONFIG = { cartoKey: " + JSON.stringify(key) + " };\n"
);
console.log("config.js ditulis (" + (key ? "kunci CARTO terisi" : "tanpa kunci") + ")");
