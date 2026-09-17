/**
 * Runtime configuration. The dev server proxies nothing, so point apiBaseUrl at
 * the NestJS backend directly (see clearit-be, default port 3000).
 */
export const ENVIRONMENT = {
  production: false,
  appName: 'ClearIt Admin',
  apiBaseUrl: 'http://localhost:3000/api/v1',
  /** Auto-refresh interval for live screens (dashboard, live bookings). */
  livePollIntervalMs: 30_000,
};
