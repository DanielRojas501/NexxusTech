import { api } from '@/api/apiClient';
import { isGuestSession } from './guestStore';

const GUEST_KEY = 'apoya_guest_eval_modes';

export const EVAL_MODES = {
  examen: {
    label: 'El examen lo es todo',
    short: '80–100% examen',
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
    ring: 'ring-amber-400/30',
    hint: 'La app prioriza exámenes cronometrados y resolución rápida por etapas.',
    cta: { label: 'Abrir examen cronometrado', to: '/examen' },
  },
  proyectos: {
    label: 'Cero exámenes · proyectos y tareas',
    short: 'Proyectos y tareas',
    color: 'text-emerald-300',
    bg: 'bg-emerald-400/10',
    ring: 'ring-emerald-400/30',
    hint: 'La app prioriza lecciones, desgloses paso a paso e interpretación de simulaciones para entregar.',
    cta: { label: 'Lecciones y desgloses', to: null },
  },
  tradicional: {
    label: 'Evaluación tradicional por unidades',
    short: 'Por unidades',
    color: 'text-cyan-300',
    bg: 'bg-cyan-400/10',
    ring: 'ring-cyan-400/30',
    hint: 'Flujo de avance temático habitual con la ruta de aprendizaje de la materia.',
    cta: null,
  },
};

const readGuestModes = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || {};
  } catch {
    return {};
  }
};

export async function getEvalModes() {
  if (isGuestSession()) return readGuestModes();
  const recs = await api.entities.SubjectEvalConfig.list('-updated_date', 100);
  return Object.fromEntries(recs.map((r) => [r.subject_id, r.mode]));
}

export async function setEvalMode(subjectId, mode) {
  if (isGuestSession()) {
    const modes = { ...readGuestModes(), [subjectId]: mode };
    localStorage.setItem(GUEST_KEY, JSON.stringify(modes));
    return modes;
  }
  const [rec] = await api.entities.SubjectEvalConfig.filter({ subject_id: subjectId });
  if (rec) await api.entities.SubjectEvalConfig.update(rec.id, { mode });
  else await api.entities.SubjectEvalConfig.create({ subject_id: subjectId, mode });
  return mode;
}