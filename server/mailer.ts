import { config } from './config.js';

export type ResetEmailTransport = (to: string, resetUrl: string) => Promise<void>;

export const mailConfigured = Boolean(config.mail.apiKey && config.mail.from);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** Proveedor por defecto: Resend (API HTTP, sin dependencias). Sustituible en un solo lugar. */
const resendTransport: ResetEmailTransport = async (to, resetUrl) => {
  const safeUrl = escapeHtml(resetUrl);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mail.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.mail.from,
      to: [to],
      subject: 'Restablece tu contraseña de ApoyandoTec',
      text: `Recibimos una solicitud para restablecer tu contraseña.\n\nAbre este enlace (vence en 30 minutos):\n${resetUrl}\n\nSi no fuiste tú, ignora este mensaje.`,
      html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${safeUrl}">Restablecer contraseña</a> (vence en 30 minutos).</p><p>Si no fuiste tú, ignora este mensaje.</p>`,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`El proveedor de correo respondió ${response.status}`);
};

/** Solo desarrollo: el enlace va a la consola del servidor, JAMÁS a la respuesta HTTP. */
const consoleTransport: ResetEmailTransport = async (to, resetUrl) => {
  console.info(`[dev] Enlace de restablecimiento para ${to}: ${resetUrl}`);
};

let transport: ResetEmailTransport | null = mailConfigured
  ? resendTransport
  : config.isDevelopment && !config.isTest
    ? consoleTransport
    : null;

/** Permite inyectar un transporte falso en las pruebas. */
export function setResetEmailTransport(next: ResetEmailTransport | null): void {
  transport = next;
}

export const canSendMail = () => transport !== null;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!transport) throw new Error('No hay proveedor de correo configurado.');
  await transport(to, resetUrl);
}
