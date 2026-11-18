import { useEffect, useRef, useState } from 'react';
import { Clock, Calculator as CalcIcon, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Calculator from './Calculator';
import FormulaSheet from './FormulaSheet';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function ExamRunner({ questions, minutes, onFinish }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState(minutes * 60);
  const [calc, setCalc] = useState(false);
  const ref = useRef({});
  ref.current = { answers, left };
  const finish = () => onFinish(ref.current.answers, minutes * 60 - ref.current.left);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (left <= 0) finish(); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = questions[idx];
  const answered = Object.values(answers).filter((v) => v !== '').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="panel p-3 sm:p-4 flex items-center justify-between gap-3 sticky top-20 z-30 bg-card/90">
        <div className={`flex items-center gap-2 font-mono text-lg sm:text-xl ${left < 120 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}><Clock className="w-5 h-5" />{mmss(Math.max(left, 0))}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCalc((v) => !v)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${calc ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'}`}><CalcIcon className="w-4 h-4" /><span className="hidden sm:inline">Calculadora</span></button>
          <FormulaSheet />
          <button onClick={finish} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium hover:brightness-110"><Send className="w-4 h-4" /><span className="hidden sm:inline">Entregar</span></button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((qq, i) => (
          <button key={qq.id} onClick={() => setIdx(i)} className={`w-9 h-9 rounded-lg font-mono text-sm border transition-all ${i === idx ? 'border-primary bg-primary/15 text-primary' : answers[i] ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : 'border-border/70 text-muted-foreground'}`}>{i + 1}</button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">{answered}/{questions.length} respondidas</span>
      </div>
      <div className="panel p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-primary">REACTIVO {idx + 1}</span>
          <span className="text-muted-foreground">· {q.subject}</span>
        </div>
        <p className="text-lg sm:text-xl leading-relaxed">{q.text}</p>
        <div className="relative">
          <input autoFocus value={answers[idx] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [idx]: e.target.value }))} placeholder="Escribe tu respuesta numérica" inputMode="decimal"
            className="w-full rounded-xl bg-slate-950/70 border border-border px-4 py-3.5 pr-16 font-mono text-lg focus:outline-none focus:border-primary" />
          {q.unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{q.unit}</span>}
        </div>
        <div className="flex justify-between">
          <button onClick={() => setIdx((i) => i - 1)} disabled={idx === 0} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-sm disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Anterior</button>
          {idx < questions.length - 1
            ? <button onClick={() => setIdx((i) => i + 1)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Siguiente <ChevronRight className="w-4 h-4" /></button>
            : <button onClick={finish} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-violet-500 text-white text-sm font-medium">Entregar examen <Send className="w-4 h-4" /></button>}
        </div>
      </div>
      {calc && <Calculator onClose={() => setCalc(false)} />}
    </div>
  );
}