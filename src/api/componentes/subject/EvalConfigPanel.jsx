import { useEffect, useState } from 'react';
import { GraduationCap, Check } from 'lucide-react';
import { getEvalModes, setEvalMode, EVAL_MODES } from '@/lib/evalMode';

export default function EvalConfigPanel({ subject }) {
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEvalModes()
      .then((m) => setMode(m[subject.id] || 'tradicional'))
      .catch(() => setMode('tradicional'));
  }, [subject.id]);

  const pick = async (m) => {
    if (saving) return;
    setMode(m);
    setSaving(true);
    try {
      await setEvalMode(subject.id, m);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="panel p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center bg-amber-400/10 ring-1 ring-amber-400/30">
          <GraduationCap className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h3 className="font-semibold">Criterio de evaluación de tu profesor</h3>
          <p className="text-sm text-muted-foreground">Elige cómo evalúa tu profesor actual: la app reorganiza sus recomendaciones de estudio en el Dashboard.</p>
        </div>
      </div>
      {mode === null ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-3">
          {Object.entries(EVAL_MODES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => pick(key)}
              disabled={saving}
              className={`text-left rounded-xl border p-4 space-y-2 transition-all ${mode === key ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono uppercase tracking-widest rounded-full px-2 py-1 ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring}`}>{cfg.short}</span>
                {mode === key && <Check className="w-4 h-4 text-primary" />}
              </div>
              <div className="font-medium text-sm">{cfg.label}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{cfg.hint}</p>
            </button>
          ))}
        </div>
      )}
      {saving && <p className="text-xs text-muted-foreground">Guardando…</p>}
    </div>
  );
}