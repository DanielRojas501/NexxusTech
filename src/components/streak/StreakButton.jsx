import { useNavigate } from 'react-router-dom';
import { Flame, Snowflake, Trophy, ArrowRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { emptyStreak, localDay, shiftDays, streakStatus, FREEZE_EVERY, MAX_FREEZES } from '@/lib/streakRules';

const MOOD = {
  done: { text: '¡Hoy ya cuenta! Vuelve mañana para seguir.', chip: 'text-dorado-200 dark:text-dorado-300' },
  at_risk: { text: 'Resuelve un ejercicio o el reto del día antes de medianoche para no perderla.', chip: 'text-white animate-pulse dark:text-primary' },
  protected: { text: 'Faltaste, pero tu protector la cubre si estudias hoy.', chip: 'text-sky-200 dark:text-sky-300' },
  lost: { text: 'Se reinició. Hoy puede empezar una nueva (y tu récord sigue ahí).', chip: 'text-guinda-100/70 dark:text-muted-foreground' },
  new: { text: 'Resuelve tu primer ejercicio o el reto del día para encender la racha.', chip: 'text-guinda-100/70 dark:text-muted-foreground' },
};
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function StreakButton({ user }) {
  const navigate = useNavigate();
  const today = localDay();
  const state = { ...emptyStreak(), ...user };
  const { current, mood } = streakStatus(state, today);
  const active = new Set(state.active_days);
  const frozen = new Set(state.frozen_days);

  // 5 semanas que terminan en la semana de hoy, de lunes a domingo.
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = shiftDays(today, -weekday - 28);
  const days = Array.from({ length: 35 }, (_, i) => shiftDays(start, i));

  const goToChallenge = () => {
    navigate('/');
    setTimeout(() => document.getElementById('reto')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Racha: ${current} ${current === 1 ? 'día' : 'días'}. Ver detalles`}
          className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 hover:bg-white/20 dark:bg-secondary dark:hover:bg-secondary/70 transition-colors ${MOOD[mood].chip}`}
        >
          <Flame className="w-3 h-3" />{current}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-guinda-900 to-guinda-700 px-5 py-4 text-guinda-50">
          <div className="flex items-center gap-3">
            <Flame className={`w-9 h-9 ${current ? 'text-dorado-300' : 'text-guinda-200/60'}`} />
            <div>
              <div className="text-3xl font-bold font-heading leading-none">{current}</div>
              <div className="text-xs text-guinda-100">{current === 1 ? 'día seguido' : 'días seguidos'} estudiando</div>
            </div>
          </div>
          <p className="mt-3 text-sm">{MOOD[mood].text}</p>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] text-muted-foreground mb-1">
              {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5" role="img" aria-label={`Calendario: ${state.active_days.length} días de estudio registrados`}>
              {days.map((d) => (
                <span
                  key={d}
                  title={d}
                  className={`aspect-square rounded-md grid place-items-center ${
                    active.has(d) ? 'bg-primary' : frozen.has(d) ? 'bg-sky-400/30' : d > today ? 'bg-transparent' : 'bg-secondary'
                  } ${d === today ? 'ring-2 ring-primary ring-offset-1 ring-offset-popover' : ''}`}
                >
                  {frozen.has(d) && <Snowflake className="w-3 h-3 text-sky-300" />}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-secondary px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Trophy className="w-3.5 h-3.5" /> Récord</div>
              <div className="font-semibold">{state.best_streak} {state.best_streak === 1 ? 'día' : 'días'}</div>
            </div>
            <div className="rounded-lg bg-secondary px-3 py-2" title={`Ganas 1 cada ${FREEZE_EVERY} días seguidos (máximo ${MAX_FREEZES}). Cubre un día que faltes.`}>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Snowflake className="w-3.5 h-3.5" /> Protectores</div>
              <div className="font-semibold">{state.streak_freezes} de {MAX_FREEZES}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Cuenta un día cuando resuelves algo: ejercicio, examen, diagnóstico o reto. Cada {FREEZE_EVERY} días seguidos ganas un protector.</p>

          {mood !== 'done' && (
            <button onClick={goToChallenge} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium">
              Ir al reto del día <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
