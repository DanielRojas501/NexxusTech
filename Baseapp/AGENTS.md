# Project instructions

- This is a self-hosted React/Vite application with an Express API.
- Read `README.md` and `.env.example` for local development and deployment.
- The API uses a JSON file for local persistence; keep data access behind `server/store.ts` so a SQL database can replace it later.
- Never expose server secrets through frontend `VITE_` variables.
- Run `npm run typecheck:server`, `npm run lint`, and `npm run build` after relevant changes.
