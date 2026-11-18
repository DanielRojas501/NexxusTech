import { api } from '@/api/apiClient';

// Estado compartido: cada simulador registra un resumen de sus sliders/valores
// actuales para que "Profe Bot" pueda leer el contexto de la simulación.
const snapshots = {};
const MAX_AGE = 5 * 60 * 1000;

export function setSimSnapshot(simId, summary) {
  snapshots[simId] = { summary, _ts: Date.now() };
}

export function getSimSnapshot(simId) {
  const s = snapshots[simId];
  if (!s || Date.now() - s._ts > MAX_AGE) return null;
  return s.summary;
}

export function getSimContextSummary() {
  return Object.values(snapshots)
    .filter((s) => Date.now() - s._ts <= MAX_AGE)
    .map((s) => s.summary)
    .join(' · ');
}

// Pide al tutor socrático una micro-pista teórica sobre un evento de la simulación.
export async function askSimHint(question, context) {
  const res = await api.functions.invoke('profeBot', { question, context, history: [] });
  return res?.reply || 'No se pudo generar la pista. Inténtalo de nuevo.';
}