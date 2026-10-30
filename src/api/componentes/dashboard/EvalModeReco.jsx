import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Settings2 } from 'lucide-react';
import { getSubject } from '@/data/subjects';
import { getEvalModes, EVAL_MODES } from '@/lib/evalMode';

export default function EvalModeReco() {
  const [modes, setModes] = useState(null);

  useEffect(() => {
    getEvalModes()
      .then(setModes)
      .catch(() => setModes({}));
  }, []);

  if (modes === null) return null;
  const entries = Object.entries(modes).filter(([id]) => getSubject(id));
  if (!entries.length) return null;

  return (
    <section className="space-y-4">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" /> Según tu profesor
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold mt-1">Recomendaciones por criterio de evaluación</h2>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          Ajustadas al modo que configuraste en la pestaña “Criterio del profe” de cada materia.
          <Settings2 className="w-3.5 h-3.5" />
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([subjectId, mode]) => {
          const subject = getSubject(subjectId);
          const cfg = EVAL_MODES[mode] || EVAL_MODES.tradicional;
          const cta = cfg.cta || { label: 'Continuar ruta de temas', to: `/materia/${subjectId}` };
          return (
            <Link key={subjectId} to={cta.to || `/materia/${subjectId}`} className="panel p-5 space-y-3 hover:border-primary/50 transition-colors group">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest rounded-full px-2 py-1 ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring}`}>{cfg.short}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="font-semibold leading-snug">{subject.name}</div>
              <p className="text-sm text-muted-foreground">{cfg.hint}</p>
              <div className="text-sm font-medium text-primary">{cta.label}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}