import { isDevMode } from '@angular/core';
import { ENV } from './env.generated';

/** Through the dev-server proxy in `npm start`, straight to the API otherwise. */
const viaDevProxy = ENV.devProxy && isDevMode();

/**
 * Runtime configuration. The API comes from admin-panel/.env (see scripts/env.mjs).
 */
export const ENVIRONMENT = {
  production: !isDevMode(),
  appName: 'Szoop Admin',
  apiBaseUrl: viaDevProxy ? new URL(ENV.apiUrl).pathname : ENV.apiUrl,
  /** Where requests end up, for display. */
  apiTarget: ENV.apiUrl,
  googleMapsApiKey: ENV.googleMapsApiKey,
  /** Auto-refresh interval for live screens (dashboard, live bookings). */
  livePollIntervalMs: 30_000,
  /** package.json version plus the git commit this build was made from. */
  versionLabel: `v${ENV.version} · ${ENV.commit}`,
  builtAt: ENV.builtAt,
};
