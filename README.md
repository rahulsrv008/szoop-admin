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

API base URL is set in `src/config/environment.ts` (`http://localhost:3000/api/v1`). CORS on the backend must allow `http://localhost:4200`.

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
