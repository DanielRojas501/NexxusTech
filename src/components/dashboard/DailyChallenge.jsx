import { useMemo, useState } from 'react';
import { Bot, CalendarCheck2, CheckCircle2, Flame, Loader2, Share2, Zap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { buildDailyChallenge } from '@/data/examBank';
import { localDay } from '@/lib/streakRules';
import { parseNum, isClose, fmt } from '@/lib/check';
import { awardXP } from '@/lib/progress';
import { askProfeBot } from '@/lib/askProfeBot';

/** Un problema al día, el mismo para todo el Tec: cuenta para la racha y da +25 XP una vez. */
export default function DailyChallenge() {
  const { user, checkUserAuth } = useAuth();
  const day = localDay();
  const challenge = useMemo(() => buildDailyChallenge(day), [day]);
  const [val, setVal] = useState('');
  const [status, setStatus] = useState('idle'); // idle | wrong | saving | ok
  const [hint, setHint] = useState('');
  const [hintBusy, setHintBusy] = useState(false);
  const [shared, setShared] = useState(false);
  const solved = status === 'ok' || user?.daily_challenge_date === day;

  const check = async () => {
    if (!isClose(parseNum(val), challenge.answer, 0.02)) return setStatus('wrong');
    setStatus('saving');
    try {
      await awardXP('daily');
      await checkUserAuth();
    } catch (e) {
      console.error(e);
    }
    setStatus('ok');
    import('canvas-confetti').then(({ default: confetti }) =>
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ['#6D0C2E', '#C5A059', '#F6E1E7'] }));
  };

  const askHint = async () => {
    setHintBusy(true);
    try {
      const res = await askProfeBot({
        question: val ? `En el reto del día puse ${val} y no sale. ¿Qué reviso?` : 'No sé cómo empezar el reto del día.',
        context: `Reto del día (${challenge.subject}): ${challenge.text}`,
      });
      setHint(res.reply);
    } catch {
      setHint('No pude conectar con Profe Bot. Intenta de nuevo.');
    }
    setHintBusy(false);
  };

  const share = async () => {
    const text = `Ya resolví el reto de hoy de ApoyandoTec (${challenge.subject}) 🔥 ¿Lo sacas tú?`;
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: 'Reto del día · ApoyandoTec', text, url });
      else await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  };

  return (
    <section id="reto" className="panel relative overflow-hidden p-5 sm:p-6 scroll-mt-24">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30">
            <CalendarCheck2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Reto del día</h2>
            <p className="text-xs text-muted-foreground">El mismo problema para todo el Tec · {challenge.subject}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs">
          <Flame className="w-3.5 h-3.5 text-primary" /> Cuenta para tu racha · <Zap className="w-3 h-3 text-amber-300" />+25 XP
        </span>
      </div>

      <p className="relative mt-4 text-base sm:text-lg">{challenge.text}</p>

      {solved ? (
        <div className="relative mt-4 flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-emerald-300 font-medium">
            <CheckCircle2 className="w-5 h-5" /> ¡Resuelto! Vuelve mañana por el siguiente.
          </p>
          <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary transition-colors">
            <Share2 className="w-4 h-4" /> {shared ? '¡Listo para pegar en el grupo!' : 'Retar a mis compañeros'}
          </button>
          {status !== 'ok' && <span className="text-xs text-muted-foreground font-mono">Respuesta: {fmt(challenge.answer)} {challenge.unit}</span>}
        </div>
      ) : (
        <div className="relative mt-4 space-y-3">
          <div className="flex gap-2 max-w-md">
            <input
              value={val}
              onChange={(e) => { setVal(e.target.value); if (status === 'wrong') setStatus('idle'); }}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              placeholder={challenge.unit ? `Respuesta en ${challenge.unit}` : 'Respuesta'}
              inputMode="decimal"
              aria-label="Respuesta del reto del día"
              className="flex-1 min-w-0 rounded-lg bg-background/60 border border-border px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
            />
            <button onClick={check} disabled={!val || status === 'saving'} className="px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Responder'}
            </button>
          </div>
          {status === 'wrong' && <p className="text-sm text-destructive">Todavía no. Revisa unidades y redondeo, o pide una pista.</p>}
          <button onClick={askHint} disabled={hintBusy} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-60">
            {hintBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} Pedir pista a Profe Bot
          </button>
          {hint && <p className="rounded-lg bg-secondary px-3 py-2 text-sm max-w-xl"><span className="font-medium">Profe Bot:</span> {hint}</p>}
        </div>
      )}
    </section>
  );
}
