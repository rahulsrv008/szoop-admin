/**
 * Angular has no .env support, so `npm start` / `npm run build` run this first:
 * it reads admin-panel/.env (shell variables win) and writes
 * src/config/env.generated.ts, which src/config/environment.ts imports.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  API_URL: 'https://clearit-be.vercel.app/api/v1',
  DEV_PROXY: 'true',
};

function parseDotenv(file) {
  if (!existsSync(file)) return {};
  const values = {};
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

export function loadEnv() {
  const fromFile = parseDotenv(resolve(root, '.env'));
  const pick = (key) => process.env[key] ?? fromFile[key] ?? DEFAULTS[key];
  const apiUrl = pick('API_URL').replace(/\/+$/, '');
  new URL(apiUrl); // fail fast on a typo rather than at the first request
  return { apiUrl, devProxy: pick('DEV_PROXY') !== 'false' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const env = loadEnv();
  const out = resolve(root, 'src/config/env.generated.ts');
  writeFileSync(
    out,
    `// Generated from .env by scripts/env.mjs. Edit .env, not this file.\n` +
      `export const ENV = ${JSON.stringify(env, null, 2)} as const;\n`,
  );
  console.log(`[env] API_URL=${env.apiUrl} DEV_PROXY=${env.devProxy}`);
}
