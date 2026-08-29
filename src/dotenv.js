'use strict';

/**
 * Minimal .env loader (no external dependency).
 * Reads KEY=VALUE lines from .env into process.env (without overwriting
 * variables already set by the real environment). Safe to require multiple times.
 */

const fs = require('fs');
const path = require('path');

let loaded = false;

module.exports = function loadDotEnv(file = '.env') {
  if (loaded) return;
  loaded = true;
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
};
