import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GripHorizontal, Delete } from 'lucide-react';
import { evaluate } from './calcEval';

const KEYS = ['sin(', 'cos(', 'tan(', '√(', 'ln(', 'log(', '^', 'π', '7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '(', ')', 'e', '+'];

export default function Calculator({ onClose }) {
  const [expr, setExpr] = useState('');
  const [res, setRes] = useState('');
  const calc = () => { try { setRes(String(evaluate(expr))); } catch { setRes('Error'); } };

  return (
    <motion.div drag dragMomentum={false} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 right-4 sm:right-6 z-50 w-[280px] rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 cursor-grab active:cursor-grabbing">
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><GripHorizontal className="w-4 h-4" /> Calculadora · RAD</span>
        <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-3 space-y-3">
        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-right font-mono min-h-[60px]">
          <div className="text-xs text-muted-foreground break-all min-h-[16px]">{expr || '0'}</div>
          <div className="text-xl text-cyan-300 break-all">{res || ' '}</div>
        </div>
        <div className="grid grid-cols-4 gap-1.5" onPointerDownCapture={(e) => e.stopPropagation()}>
          {KEYS.map((k) => (
            <button key={k} onClick={() => setExpr((v) => v + k)} className={`py-2 rounded-lg text-sm font-mono transition-colors ${/[0-9.]/.test(k) ? 'bg-secondary hover:bg-secondary/70' : 'bg-slate-800/60 text-cyan-200 hover:bg-slate-700/70'}`}>{k.length > 1 ? k.replace('(', '') : k}</button>
          ))}
          <button onClick={() => { setExpr(''); setRes(''); }} className="py-2 rounded-lg text-sm bg-rose-500/20 text-rose-200 hover:bg-rose-500/30">AC</button>
          <button onClick={() => setExpr((v) => v.slice(0, -1))} className="py-2 rounded-lg bg-slate-800/60 grid place-items-center hover:bg-slate-700/70"><Delete className="w-4 h-4" /></button>
          <button onClick={calc} className="col-span-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110">=</button>
        </div>
      </div>
    </motion.div>
  );
}