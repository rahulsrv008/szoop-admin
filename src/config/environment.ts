/**
 * Runtime configuration. All admin environments talk to the deployed Nest API.
 */
export const ENVIRONMENT = {
  production: false,
  appName: 'ClearIt Admin',
  apiBaseUrl: 'https://clearit-be.vercel.app/api/v1',
  /** Auto-refresh interval for live screens (dashboard, live bookings). */
  livePollIntervalMs: 30_000,
};
