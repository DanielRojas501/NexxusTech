import { useState } from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseNum, isClose, fmt } from '@/lib/check';

export default function StepInput({ step, index, params }) {
  const [val, setVal] = useState('');
  const [status, setStatus] = useState('idle');
  const [hint, setHint] = useState('');
  const correct = step.compute(params);

  const check = () => {
    const u = parseNum(val);
    if (u === null) { setStatus('wrong'); setHint('Escribe un valor numérico (usa punto o coma decimal).'); return; }
    if (isClose(u, correct)) { setStatus('ok'); return; }
    setStatus('wrong');
    setHint(step.diagnose?.(u, params) || step.hint);
  };

  return (
    <div className={`rounded-xl border p-4 transition-colors ${status === 'ok' ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-border/60 bg-slate-950/40'}`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 w-7 h-7 rounded-full grid place-items-center text-xs font-mono ${status === 'ok' ? 'bg-verde-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
          {status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="text-sm font-medium">{step.label}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{step.formula}</div>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={val} onChange={(e) => { setVal(e.target.value); if (status !== 'idle') setStatus('idle'); }} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="Tu resultado" inputMode="decimal"
                className="w-full rounded-lg bg-slate-950/70 border border-border/70 px-3 py-2 pr-14 font-mono text-sm focus:outline-none focus:border-primary" />
              {step.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{step.unit}</span>}
            </div>
            <button onClick={check} className="px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition">Verificar</button>
          </div>
          <AnimatePresence>
            {status === 'ok' && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-emerald-300">Correcto: {fmt(correct)} {step.unit}</motion.p>}
            {status === 'wrong' && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 rounded-lg bg-amber-400/10 border border-amber-400/30 p-3 text-xs text-amber-100">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-300" /> <span>{hint}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}