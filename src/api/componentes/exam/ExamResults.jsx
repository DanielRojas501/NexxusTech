import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { parseNum, isClose, fmt } from '@/lib/check';

export default function ExamResults({ questions, answers, timeUsed, onRetry }) {
  const graded = questions.map((q, i) => ({ ...q, given: answers[i] ?? '', ok: isClose(parseNum(answers[i]), q.answer, 0.02) }));
  const correct = graded.filter((g) => g.ok).length;
  const pct = Math.round((correct / questions.length) * 100);
  const areas = Object.entries(graded.reduce((m, g) => { (m[g.area] ||= { ok: 0, n: 0 }); m[g.area].n++; if (g.ok) m[g.area].ok++; return m; }, {}));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="panel p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
        <div className="relative">
          <Trophy className={`w-8 h-8 mx-auto ${pct >= 70 ? 'text-amber-300' : 'text-muted-foreground'}`} />
          <div className="mt-3 font-heading text-6xl font-bold">{pct}<span className="text-2xl text-muted-foreground">/100</span></div>
          <p className="text-muted-foreground mt-2">{correct} de {questions.length} correctas · {Math.floor(timeUsed / 60)} min {timeUsed % 60} s</p>
          <p className="mt-1 text-sm">{pct >= 90 ? 'Excelente dominio.' : pct >= 70 ? 'Aprobado: refuerza los temas marcados.' : 'Repasa los módulos y vuelve a intentarlo.'}</p>
        </div>
      </div>
      <div className="panel p-6 space-y-4">
        <h3 className="font-semibold">Desempeño por área</h3>
        {areas.map(([a, v]) => (
          <div key={a} className="space-y-1.5">
            <div className="flex justify-between text-sm"><span>{a}</span><span className="font-mono text-muted-foreground">{v.ok}/{v.n}</span></div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(v.ok / v.n) * 100}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" /></div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {graded.map((g, i) => (
          <div key={g.id} className={`panel p-4 border-l-2 ${g.ok ? 'border-l-emerald-400' : 'border-l-rose-400'}`}>
            <div className="flex gap-3">
              {g.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
              <div className="space-y-1 text-sm">
                <p><span className="font-mono text-muted-foreground mr-2">{i + 1}.</span>{g.text}</p>
                <p className="font-mono text-xs text-muted-foreground">Tu respuesta: <span className={g.ok ? 'text-emerald-300' : 'text-rose-300'}>{g.given || '—'}</span> · Correcta: <span className="text-cyan-300">{fmt(g.answer)} {g.unit}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onRetry} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/70 font-medium"><RotateCcw className="w-4 h-4" /> Nuevo examen</button>
    </div>
  );
}