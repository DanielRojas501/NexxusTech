import { useState } from 'react';
import { Eye, EyeOff, Activity } from 'lucide-react';
import { SIMS } from '@/components/sims/registry';
import ParamSlider from '@/components/sims/ParamSlider';
import StepInput from './StepInput';
import { fmt } from '@/lib/check';

export default function LiveProblem({ problem }) {
  const [p, setP] = useState(() => Object.fromEntries(problem.params.map((x) => [x.key, x.default])));
  const [showSol, setShowSol] = useState(false);
  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));
  const Sim = SIMS[problem.sim];
  const key = JSON.stringify(p);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-5">
        <div className="panel p-5 space-y-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-primary"><Activity className="w-3.5 h-3.5" /> Problema en vivo</div>
          <div>
            <h3 className="text-xl font-semibold">{problem.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">{problem.statement(p)}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
            {problem.params.map(({ key: k, label, unit, min, max, step }) => <ParamSlider key={k} label={label} unit={unit} min={min} max={max} step={step} value={p[k]} onChange={(v) => set(k, v)} />)}
          </div>
        </div>
        <div className="space-y-3">
          {problem.steps.map((s, i) => <StepInput key={key + i} step={s} index={i} params={p} />)}
        </div>
        <button onClick={() => setShowSol((v) => !v)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          {showSol ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showSol ? 'Ocultar' : 'Ver'} procedimiento completo
        </button>
        {showSol && (
          <div className="panel p-4 space-y-2 font-mono text-sm">
            {problem.steps.map((s) => (
              <div key={s.label} className="flex justify-between gap-4"><span className="text-muted-foreground">{s.formula}</span><span className="text-cyan-300">{fmt(s.compute(p))} {s.unit}</span></div>
            ))}
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-24"><Sim {...problem.simProps(p, set)} /></div>
    </div>
  );
}