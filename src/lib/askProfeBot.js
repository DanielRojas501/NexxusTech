import { api } from '@/api/apiClient';
import { isGuestSession } from './guestStore';
import { simulateProfeBot } from './profeBotSim';

/**
 * Pregunta a Profe Bot: IA real si el servidor la tiene; si no (invitado o sin
 * AI_API_KEY → 503), responde el tutor simulado. `demo` indica cuál respondió.
 */
export async function askProfeBot({ question, context = '', history = [] }) {
  const simulated = async () => {
    await new Promise((r) => setTimeout(r, 500 + Math.min(question.length * 12, 700))); // que se sienta pensado
    return { reply: simulateProfeBot({ question, context, history }), demo: true };
  };
  if (isGuestSession()) return simulated();
  try {
    const res = await api.functions.invoke('profeBot', { question, context, history });
    return { reply: res.reply, demo: false };
  } catch (e) {
    if (e?.status === 503) return simulated();
    throw e;
  }
}

/** Abre el Profe Bot flotante de la página y le manda una duda con contexto (p. ej. desde un ejercicio). */
export const openProfeBot = (question, context) =>
  window.dispatchEvent(new CustomEvent('profebot:ask', { detail: { question, context } }));
