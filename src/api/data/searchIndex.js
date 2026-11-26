import { SUBJECTS } from './subjects';
import { FORMULAS } from './formulas';
import { SIM_LABELS } from './areas';
import { THEORY } from './simTheory';
import { LIVE_PROBLEMS } from './liveProblems';
import { normalize } from '@/lib/check';

export const RESULT_STYLES = {
  Materia: { text: 'text-cyan-300', bg: 'bg-cyan-400/10' },
  Tema: { text: 'text-violet-300', bg: 'bg-violet-400/10' },
  Fórmula: { text: 'text-emerald-300', bg: 'bg-emerald-400/10' },
  'Simulación 3D': { text: 'text-amber-300', bg: 'bg-amber-400/10' },
  'Problema en vivo': { text: 'text-rose-300', bg: 'bg-rose-400/10' },
};

const subjectName = (id) => SUBJECTS.find((s) => s.id === id)?.name || id;

let INDEX = null;

export function getSearchIndex() {
  if (INDEX) return INDEX;
  const items = [];
  SUBJECTS.forEach((s) => {
    items.push({ type: 'Materia', title: s.name, subtitle: s.description, to: `/materia/${s.id}`, kw: [s.area, s.name] });
    const topics = [...new Set([...s.syllabus, ...s.modules.map((m) => m.title)])];
    topics.forEach((t) => items.push({ type: 'Tema', title: t, subtitle: s.name, to: `/materia/${s.id}`, kw: [s.name] }));
  });
  FORMULAS.forEach((g) =>
    g.items.forEach((f) => items.push({ type: 'Fórmula', title: f, subtitle: g.group, to: '/formulario', kw: [g.group] }))
  );
  Object.entries(SIM_LABELS).forEach(([key, label]) => {
    items.push({
      type: 'Simulación 3D',
      title: label,
      subtitle: THEORY[key]?.title || 'Laboratorio de simulación',
      to: `/laboratorio?sim=${key}`,
      kw: ['laboratorio', 'simulador'],
    });
  });
  LIVE_PROBLEMS.forEach((p) =>
    items.push({ type: 'Problema en vivo', title: p.title, subtitle: subjectName(p.subject), to: '/laboratorio', kw: [p.subject] })
  );
  INDEX = items;
  return items;
}

export function searchAll(query, limit = 24) {
  const q = normalize((query || '').trim());
  const items = getSearchIndex();
  if (!q) return items.slice(0, limit);
  return items
    .map((it) => {
      const t = normalize(it.title);
      const s = normalize(it.subtitle || '');
      let score = 0;
      if (t.startsWith(q)) score = 3;
      else if (t.includes(q)) score = 2;
      else if (s.includes(q) || it.kw.some((k) => normalize(k).includes(q))) score = 1;
      return score ? { ...it, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}