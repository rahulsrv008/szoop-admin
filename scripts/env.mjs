/**
 * Angular has no .env support, so start/build scripts run this first:
 * it copies .env.development / .env.uat / .env.production onto .env
 * and writes src/config/env.generated.ts.
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULTS = {
  API_URL: 'http://localhost:3000/api/v1',
  DEV_PROXY: 'true',
  GOOGLE_MAPS_API_KEY: '',
};

const MODE = {
  dev: 'development',
  development: 'development',
  uat: 'uat',
  stg: 'uat',
  staging: 'uat',
  prod: 'production',
  production: 'production',
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

function resolveMode(modeArg) {
  const raw = (modeArg || process.env.APP_ENV || 'development').toLowerCase();
  return MODE[raw] || 'development';
}

function fileFor(mode) {
  if (mode === 'uat') return 'uat';
  if (mode === 'production') return 'production';
  return 'development';
}

/** Baked in at build time so the running panel shows which commit is deployed. */
function buildIdentity() {
  let version = '0.0.0';
  try {
    version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version || version;
  } catch {
    /* keep the fallback */
  }
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* no git metadata in this build */
  }
  return { version, commit, builtAt: new Date().toISOString() };
}

export function loadEnv(modeArg) {
  const mode = resolveMode(modeArg);
  const fileName = `.env.${fileFor(mode)}`;
  const fromFile = {
    ...parseDotenv(resolve(root, fileName)),
    ...parseDotenv(resolve(root, '.env')),
  };
  const pick = (key) => process.env[key] ?? fromFile[key] ?? DEFAULTS[key];
  const apiUrl = pick('API_URL').replace(/\/+$/, '');
  new URL(apiUrl);
  return {
    appEnv: mode,
    apiUrl,
    devProxy: pick('DEV_PROXY') !== 'false',
    googleMapsApiKey: pick('GOOGLE_MAPS_API_KEY'),
    ...buildIdentity(),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = resolveMode(process.argv[2]);
  const src = resolve(root, `.env.${fileFor(mode)}`);
  if (!existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exit(1);
  }
  copyFileSync(src, resolve(root, '.env'));
  const env = loadEnv(mode);
  const out = resolve(root, 'src/config/env.generated.ts');
  writeFileSync(
    out,
    `// Generated from .env.${fileFor(mode)} by scripts/env.mjs. Edit the env file, not this file.\n` +
      `export const ENV = ${JSON.stringify(env, null, 2)} as const;\n`,
  );
  console.log(`[env] ${env.appEnv} API_URL=${env.apiUrl} DEV_PROXY=${env.devProxy}`);
}
