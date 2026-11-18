import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, RotateCcw } from 'lucide-react';

export default function WorkedExample({ example }) {
  const [shown, setShown] = useState(1);
  const done = shown > example.steps.length;
  return (
    <div className="rounded-xl border border-border/60 bg-slate-950/40 p-4 space-y-3">
      <p className="text-sm font-medium">{example.statement}</p>
      <ol className="space-y-2">
        {example.steps.slice(0, shown).map((s, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3 text-sm">
            <span className="shrink-0 w-5 h-5 rounded-md bg-secondary grid place-items-center text-[10px] font-mono text-muted-foreground">{i + 1}</span>
            <span className="font-mono text-slate-300 leading-relaxed">{s}</span>
          </motion.li>
        ))}
      </ol>
      {done && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 font-mono text-sm text-primary">Resultado: {example.result}</motion.div>}
      <div className="flex gap-3">
        {!done ? (
          <button onClick={() => setShown((v) => v + 1)} className="flex items-center gap-1 text-xs font-medium text-primary hover:brightness-125">
            {shown === example.steps.length ? 'Ver resultado' : 'Siguiente paso'} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={() => setShown(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="w-3.5 h-3.5" /> Repetir</button>
        )}
      </div>
    </div>
  );
}