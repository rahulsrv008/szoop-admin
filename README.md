# ClearIt Admin Panel

Angular 21 + Angular Material admin console for ClearIt. Talks to the NestJS API under `../clearit-be`.

## Run locally

```bash
# Terminal 1 — API (port 3000)
cd ../clearit-be
npm run start:dev

# Seed an admin once (uses ADMIN_EMAIL / ADMIN_PASSWORD from .env)
npm run seed:admin

# Terminal 2 — UI (port 4200)
cd ../admin-panel
npm start
```

Open http://localhost:4200 and sign in with the seeded admin.

The API base URL comes from `.env` (`API_URL`, default `https://clearit-be.vercel.app/api/v1`; copy `.env.example` to start). `npm start` and `npm run build` turn it into `src/config/env.generated.ts`. With `DEV_PROXY=true`, `npm start` proxies API calls through the dev server, so the backend's CORS list doesn't need your localhost port.

## Layout

```
src/
  config/          environment, constants, sidebar nav
  core/            auth session, ApiService, interceptors, guards, models
  shared/          data-table, status-badge, confirm dialog, date-filter, header/sidebar
  layouts/         admin-layout, auth-layout
  features/        auth, dashboard, customers, agents, bookings, …
  routes/          app.routes.ts (lazy feature areas)
```

## Build

```bash
npx ng build
```
