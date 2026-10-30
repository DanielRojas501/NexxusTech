# Nexxustech

Self-hosted React frontend and Express API with JWT authentication and JSON-file persistence.

## Requirements

- Node.js 20 or newer
- npm

## Local development

1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` to a random value of at least 32 characters. Configure `STRIPE_SECRET_KEY` only if you want to test checkout. `AI_API_KEY` is optional and enables Profe Bot.
3. Install dependencies with `npm install`.
4. Run the API with `npm run dev:server`.
5. In another terminal, run the frontend with `npm run dev`.

The frontend uses `VITE_API_BASE_URL` (default `http://localhost:3000/api`). The API listens on port 3000 and stores accounts and app records in `DATABASE_PATH` (default `./data/database.json`). Local password-reset requests return a short-lived link; production password reset requires an email delivery provider.

## Deployment

Run `npm run build`, then `npm start`. The Express server serves both the generated `dist` frontend and the `/api` routes. Configure `APP_URL`, `CORS_ORIGIN`, `JWT_SECRET`, and `DATABASE_PATH` for the deployment. If the frontend and API share a domain, set `VITE_API_BASE_URL=https://tudominio.com/api`. For a separate frontend domain, set the API URL and allow its origin in `CORS_ORIGIN`.

Stripe checkout requires `STRIPE_SECRET_KEY` and the Stripe price IDs. Profe Bot requires `AI_API_KEY` and optionally accepts `AI_API_URL` and `AI_MODEL`.

Authentication is local email/password with scrypt-hashed passwords and signed JWTs. Data is persisted in a JSON file and scoped by account. For multi-instance or production workloads, replace the JSON store with a transactional database before scaling horizontally.
