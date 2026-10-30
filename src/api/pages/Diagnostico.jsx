import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, Trophy, RefreshCw, LayoutGrid, AlertTriangle, Lightbulb } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import { parseNum, isClose } from '@/lib/check';
import { awardXP } from '@/lib/progress';
import { updateGuestProfile } from '@/lib/guestStore';
import { BLOCKS, BASE_QUESTIONS, FOLLOW_UPS } from '@/data/diagnosticBank';
import { getSubject } from '@/data/subjects';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const buildBasePlan = () =>
  BLOCKS.flatMap((b) => BASE_QUESTIONS[b.id].map((gen) => ({ block: b.id, q: gen(), followUp: false })));

export default function Diagnostico() {
  const { user, checkUserAuth } = useAuth();
  const [stage, setStage] = useState('intro');
  const [plan, setPlan] = useState(buildBasePlan);
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState('');
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const item = plan[idx];
  const q = item?.q;
  const block = BLOCKS.find((b) => b.id === item?.block);

  const finish = async (record) => {
    const stats = BLOCKS.map((b) => {
      const rows = record.filter((a) => a.block === b.id);
      const correct = rows.filter((r) => r.ok).length;
      return {
        id: b.id,
        label: b.label,
        color: b.color,
        asked: rows.length,
        correct,
        pct: rows.length ? Math.round((correct / rows.length) * 100) : 0,
      };
    });
    const correct = record.filter((r) => r.ok).length;
    const critical = stats.filter((s) => s.pct < 60);
    const reinforce = stats.filter((s) => s.pct >= 60 && s.pct < 80);
    const roadmapIds = [...new Set([...critical, ...reinforce].flatMap((s) => BLOCKS.find((b) => b.id === s.id).subjects))];

    setResult({ stats, correct, total: record.length, critical, reinforce, roadmapIds });
    setStage('done');
    window.scrollTo(0, 0);

    if (user) {
      try {
        const payload = {
          score_algebra: stats.find((s) => s.id === 'algebra').pct,
          score_trig: stats.find((s) => s.id === 'trig').pct,
          score_geometry: stats.find((s) => s.id === 'geometry').pct,
          score_calculus: stats.find((s) => s.id === 'calculus').pct,
          score_physics: stats.find((s) => s.id === 'physics').pct,
          detected_gaps: {
            critical: critical.map((s) => s.id),
            reinforce: reinforce.map((s) => s.id),
            detail: stats,
          },
          recommended_roadmap: { subjects: roadmapIds },
          correct,
          total: record.length,
        };
        if (user.is_guest) {
          updateGuestProfile({ diagnostics_completed: true, diagnostic_result: payload });
        } else {
          await api.entities.DiagnosticResult.create(payload);
          await api.auth.updateMe({
            diagnostics_completed: true,
            diagnostic_result: { correct, total: record.length, critical: critical.map((s) => s.id) },
          });
        }
        if (!user.diagnostics_completed) await awardXP(50);
        await checkUserAuth();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const answer = (ok) => {
    const record = [...answers, { block: item.block, ok }];
    setAnswers(record);
    setVal('');
    setShowHint(false);
    const blockWrong = record.some((a) => a.block === item.block && !a.ok);
    const nextIdx = idx + 1;
    const lastOfBlock = !plan[nextIdx] || plan[nextIdx].block !== item.block;
    let nextPlan = plan;
    if (!item.followUp && lastOfBlock && blockWrong) {
      nextPlan = [...plan];
      nextPlan.splice(nextIdx, 0, { block: item.block, q: pick(FOLLOW_UPS[item.block])(), followUp: true });
      setPlan(nextPlan);
    }
    if (nextIdx >= nextPlan.length) {
      finish(record);
    } else {
      setIdx(nextIdx);
    }
  };

  const restart = () => {
    setPlan(buildBasePlan());
    setAnswers([]);
    setIdx(0);
    setVal('');
    setResult(null);
    setShowHint(false);
    setStage('intro');
  };

  if (stage === 'intro') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
            <ClipboardCheck className="w-3.5 h-3.5" /> Evaluador de lagunas de ingeniería
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-4">Test diagnóstico adaptativo</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            20 preguntas base en 5 bloques clave. Si detectamos errores, el test profundiza en esa área para confirmar tus lagunas y trazarte una ruta de aprendizaje personalizada. Sin calificar tu nivel: solo para orientarte.
          </p>
        </div>
        <div className="space-y-2.5">
          {BLOCKS.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
              <span className="w-9 h-9 shrink-0 rounded-lg grid place-items-center bg-secondary">
                <b.icon className={`w-4 h-4 ${b.color}`} />
              </span>
              <div>
                <div className="text-sm font-medium">{b.label}</div>
                <div className="text-xs text-muted-foreground leading-snug">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setStage('run');
            window.scrollTo(0, 0);
          }}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition"
        >
          Comenzar diagnóstico · ≈10 min
        </button>
      </div>
    );
  }

  if (stage === 'done' && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="panel p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-transparent to-violet-500/10" />
          <div className="relative">
            <Trophy className="w-8 h-8 mx-auto text-amber-300" />
            <div className="mt-3 font-heading text-5xl font-bold">
              {result.correct}
              <span className="text-2xl text-muted-foreground">/{result.total}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">Tu dominio por área:</p>
            <div className="mt-5 space-y-3 text-left">
              {result.stats.map((s) => (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span>{s.label}</span>
                    <span className="font-mono">
                      {s.pct}% · {s.correct}/{s.asked}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.pct >= 80 ? 'bg-emerald-400' : s.pct >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {user && !user.diagnostics_completed && <p className="text-amber-300 text-sm mt-4">+50 XP por completar tu diagnóstico</p>}
          </div>
        </div>

        {result.critical.length > 0 && (
          <div className="panel p-5 border-rose-500/40 bg-rose-500/5 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm">Lagunas críticas detectadas</div>
              <p className="text-xs text-muted-foreground mt-1">{result.critical.map((s) => s.label).join(' · ')}</p>
            </div>
          </div>
        )}

        {result.roadmapIds.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Tu ruta de aprendizaje personalizada — empieza por estas materias:</p>
            {result.roadmapIds.map((r) => {
              const s = getSubject(r);
              if (!s) return null;
              return (
                <Link key={r} to={`/materia/${r}`} className="panel p-4 flex items-center justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.description}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary hover:bg-secondary/70 text-sm">
            <RefreshCw className="w-4 h-4" /> Rehacer test
          </button>
          <Link to="/" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
            <LayoutGrid className="w-4 h-4" /> Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
          <ClipboardCheck className="w-3.5 h-3.5" /> Test diagnóstico
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold mt-4">Bloque: {block?.label}</h1>
      </div>
      <div className="space-y-2">
        <div className="h-1.5 rounded-full bg-secondary w-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(idx / plan.length) * 100}%` }} />
        </div>
        <div className="flex gap-1.5 justify-center">
          {BLOCKS.map((b) => {
            const doneInBlock = answers.filter((a) => a.block === b.id).length;
            return (
              <span
                key={b.id}
                className={`h-1.5 rounded-full transition-all ${
                  b.id === item.block ? 'bg-primary w-10' : doneInBlock > 0 ? 'bg-emerald-400 w-7' : 'bg-secondary w-7'
                }`}
              />
            );
          })}
        </div>
      </div>
      <div className="panel p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="font-mono text-primary">
            PREGUNTA {idx + 1}/{plan.length}
          </span>
          {item.followUp && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-300 px-2.5 py-0.5">
              Profundización: confirmando una posible laguna
            </span>
          )}
        </div>
        <p className="text-lg sm:text-xl leading-relaxed">{q.text}</p>
        {showHint && (
          <p className="flex gap-2 text-sm text-amber-300">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" /> {q.hint}
          </p>
        )}
        <div className="flex gap-2">
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && answer(isClose(parseNum(val), q.answer, q.tol || 0.01))}
            placeholder="Tu respuesta"
            inputMode="decimal"
            className="flex-1 rounded-xl bg-slate-950/70 border border-border px-4 py-3.5 font-mono text-lg focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => answer(isClose(parseNum(val), q.answer, q.tol || 0.01))}
            className="px-6 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110"
          >
            Responder
          </button>
        </div>
        <button onClick={() => setShowHint((s) => !s)} className="text-xs text-muted-foreground hover:text-foreground transition">
          {showHint ? 'Ocultar pista' : 'Ver pista'}
        </button>
      </div>
    </div>
  );
}