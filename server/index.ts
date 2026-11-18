import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`API server listening on port ${config.port} (${config.isProduction ? 'production' : 'development'})`);
});

// Cierre ordenado cuando la plataforma reinicia el contenedor (deploys, escalado).
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`${signal} recibido, cerrando…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
