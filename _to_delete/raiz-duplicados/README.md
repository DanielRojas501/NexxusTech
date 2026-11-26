# NexxusTech

Frontend React/Vite + API Express/TypeScript con JWT y persistencia en archivo JSON.

## Estructura
```
NexxusTech/
├─ server/            API Express + TypeScript (app.ts, config.ts, auth.ts, store.ts, validation.ts, stripeService.ts…)
│  └─ tests/          pruebas de seguridad (node:test)
├─ src/               Frontend React
│  ├─ api/apiClient.js   cliente HTTP (único punto de contacto con la API)
│  ├─ components/     UI (ui/ = shadcn), simuladores 3D, exámenes, monetización…
│  ├─ pages/ · lib/ · hooks/ · data/
│  └─ App.jsx · main.jsx · index.css
└─ vite.config.js     alias "@" → src/
```

## Requisitos
- Node.js 20 o superior · npm

## Desarrollo local
1. `cp .env.example .env` y define `JWT_SECRET` (mín. 32 caracteres):
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   (en desarrollo, si falta, se usa un secreto aleatorio temporal; las sesiones se pierden al reiniciar).
2. `npm install`
3. `npm run dev:server` (API en :3000) y, en otra terminal, `npm run dev` (Vite en :5173).
4. En desarrollo el enlace de "Olvidé mi contraseña" se imprime en la **consola del servidor** (nunca en la respuesta HTTP).

## Pruebas y verificación
```bash
npm run test:server       # 26 pruebas de seguridad (JWT, mass-assignment, reservas, rate limit, Stripe…)
npm run typecheck:server  # tipos del backend
npm run typecheck         # frontend (checkJs por archivo con // @ts-check)
npm run check             # todo lo anterior + lint + pruebas + build
```

## Despliegue (Railway / Render / Fly)
El servidor Express sirve el frontend compilado y la API en el **mismo dominio**; no hace falta `VITE_API_BASE_URL`.

1. **Volumen persistente** (imprescindible: sin él se pierden los datos en cada deploy). En Railway: *Volumes → Add* montado en `/data`.
2. Variables de entorno (ver `.env.example`):
   | Variable | Obligatoria | Nota |
   |---|---|---|
   | `JWT_SECRET` | ✅ | ≥ 32 caracteres aleatorios. Sin ella el servidor **no arranca**. |
   | `APP_URL` | ✅ | `https://tu-dominio.com` (enlaces de correo, Stripe y CORS). |
   | `DATABASE_PATH` | ✅ | `/data/database.json` (dentro del volumen). |
   | `TRUST_PROXY` | — | `1` por defecto en producción (necesario para el rate limit tras el proxy). |
   | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | si usas pagos | Con Stripe activo en producción las tres últimas son obligatorias. |
   | `RESEND_API_KEY`, `MAIL_FROM` | para restablecer contraseña | Sin proveedor, `/forgot-password` responde 503. |
3. Build y arranque: `npm ci && npm run build` → `npm start` (`NODE_ENV=production` ya está en el script; además, cualquier valor distinto de `development`/`test` se trata como producción).
4. Healthcheck: `GET /api/health`.

### Webhook de Stripe (necesario para que cancelar quite Premium)
En el Dashboard de Stripe → *Developers → Webhooks → Add endpoint*:
- URL: `https://tu-dominio.com/api/stripe/webhook`
- Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copia el *Signing secret* (`whsec_…`) a `STRIPE_WEBHOOK_SECRET`.

Prueba local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Modelo de seguridad (resumen)
- **El cliente nunca fija XP, nivel, créditos, suscripción, `is_tutor`, precios ni estados.** `PATCH /api/auth/me` solo acepta `full_name`; el resto se modifica con reglas del servidor (`/functions/awardXp`, `/touchStreak`, `/consume3DCredit`, Stripe, creación de `TutorProfile`).
- Cada entidad tiene una **lista blanca** de campos (`server/validation.ts`); lo demás se descarta.
- Las reservas calculan precio/comisión en el servidor a partir de la tarifa del asesor y quedan inmutables al pagarse.
- JWT HS256 con `iss`/`aud`/`exp` y versión de credenciales: cambiar la contraseña revoca todas las sesiones.
- Rate limiting por IP, por cuenta y por usuario; webhook con firma verificada e idempotente.
- Para más de una instancia o carga real, sustituye `server/store.ts` por una base SQL (SQLite/Postgres) manteniendo las mismas funciones exportadas, y usa un store compartido para el rate limit.
