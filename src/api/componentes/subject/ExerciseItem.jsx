import { useRef, useState } from 'react';
import { CheckCircle2, Lightbulb, Zap } from 'lucide-react';
import { parseNum, isClose } from '@/lib/check';

export default function ExerciseItem({ ex, n, onCorrect }) {
  const [val, setVal] = useState('');
  const [status, setStatus] = useState('idle');
  const [tries, setTries] = useState(0);
  const [reveal, setReveal] = useState(false);
  const fired = useRef(false);
  const isChoice = !!ex.options;

  const markOk = () => {
    setStatus('ok');
    if (!fired.current) { fired.current = true; onCorrect?.(); }
  };

  const check = (choice) => {
    const ok = isChoice ? choice === ex.answer : isClose(parseNum(val), ex.answer, ex.tol);
    if (ok) markOk();
    else { setStatus('wrong'); setTries((t) => t + 1); }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-slate-950/40 p-4 space-y-3">
      <p className="text-sm"><span className="font-mono text-muted-foreground mr-2">E{n}</span>{ex.q}</p>
      {isChoice ? (
        <div className="flex flex-wrap gap-2">
          {ex.options.map((o, i) => (
            <button key={o} onClick={() => check(i)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${status === 'ok' && i === ex.answer ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-border/70 hover:border-primary'}`}>{o}</button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2">
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && check()} placeholder="Respuesta" inputMode="decimal"
            className="flex-1 rounded-lg bg-slate-950/70 border border-border/70 px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary" />
          <button onClick={() => check()} className="px-4 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-sm font-medium transition-colors">Revisar</button>
        </div>
      )}
      {status === 'ok' && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4" /> ¡Correcto! {onCorrect && <span className="flex items-center gap-0.5 text-amber-300"><Zap className="w-3 h-3" />+15 XP</span>}
        </p>
      )}
      {status === 'wrong' && (
        <div className="flex gap-2 rounded-lg bg-amber-400/10 border border-amber-400/30 p-3 text-xs text-amber-100">
          <Lightbulb className="w-4 h-4 shrink-0 text-amber-300" />
          <div className="space-y-1.5">
            <p>Pista: {ex.hint}</p>
            {tries >= 2 && !reveal && <button onClick={() => setReveal(true)} className="underline text-amber-300">Ver respuesta</button>}
            {reveal && <p className="font-mono">Respuesta: {isChoice ? ex.options[ex.answer] : ex.answer}</p>}
          </div>
        </div>
      )}
    </div>
  );
}