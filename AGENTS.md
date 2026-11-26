# Project instructions

- This is a self-hosted React/Vite application with an Express API.
- Read `README.md` and `.env.example` for local development and deployment.
- The API uses PostgreSQL (`server/schema.sql`, `server/db.ts`; PGlite locally and in tests). Keep data access behind `server/store.ts`.
- Never expose server secrets through frontend `VITE_` variables.
- Run `npm run typecheck:server`, `npm run lint`, and `npm run build` after relevant changes.
