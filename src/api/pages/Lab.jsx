import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { SIMS } from '@/components/sims/registry';
import { SIM_LABELS } from '@/data/areas';
import { LIVE_PROBLEMS } from '@/data/liveProblems';
import Pills from '@/components/sims/Pills';
import TheoryPanel from '@/components/sims/TheoryPanel';
import LiveProblem from '@/components/problems/LiveProblem';
import { useAuth } from '@/lib/AuthContext';
import { isPremium, get3DState, consume3DCredit, FREE_DAILY_3D } from '@/lib/monetization';
import PaywallModal from '@/components/monetization/PaywallModal';
import AdBanner from '@/components/monetization/AdBanner';

const SIM_KEYS = ['engine3d', 'gears3d', 'truss3d', 'rotation', 'vector3d', 'grapher', 'riemann', 'oscillator', 'network'];
const THREE_D_KEYS = ['engine3d', 'gears3d', 'truss3d', 'vector3d'];

export default function Lab() {
  const [sim, setSim] = useState(() => {
    const s = new URLSearchParams(window.location.search).get('sim');
    return SIMS[s] ? s : 'rotation';
  });
  const [prob, setProb] = useState(LIVE_PROBLEMS[0].id);
  const { user } = useAuth();
  const premium = isPremium(user);
  const [paywall, setPaywall] = useState(false);
  const [remaining, setRemaining] = useState(premium ? FREE_DAILY_3D : get3DState(user).remaining);
  const Sim = SIMS[sim];
  const problem = LIVE_PROBLEMS.find((p) => p.id === prob);

  // Si se entra con una simulación 3D por URL, consume un crédito del día.
  useEffect(() => {
    if (premium || !THREE_D_KEYS.includes(sim)) return undefined;
    consume3DCredit(user).then((r) => {
      if (!r.allowed) {
        setPaywall(true);
        setSim('rotation');
      } else {
        setRemaining(r.remaining);
      }
    });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseSim = async (next) => {
    if (premium || !THREE_D_KEYS.includes(next)) {
      setSim(next);
      return;
    }
    const r = await consume3DCredit(user);
    if (!r.allowed) {
      setPaywall(true);
      return;
    }
    setRemaining(r.remaining);
    setSim(next);
  };

  return (
    <div className="space-y-14">
      <section className="space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-primary">Sandbox interactivo</span>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2">Laboratorio de simulación</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Cambia los parámetros y observa la física y las matemáticas reaccionar en tiempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 flex-1 min-w-0">
            <Pills options={SIM_KEYS.map((k) => ({ id: k, label: SIM_LABELS[k] }))} value={sim} onChange={chooseSim} />
          </div>
          {!premium && (
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-dorado-500/40 bg-dorado-500/10 px-3 py-1.5 text-xs font-mono text-dorado-300">
              <Zap className="w-3.5 h-3.5" /> Consultas 3D hoy: {remaining}/{FREE_DAILY_3D}
            </span>
          )}
        </div>
        <div key={sim} className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
          <Sim />
          <TheoryPanel theoryKey={sim} />
        </div>
        {!premium && <AdBanner variant="foot" />}
      </section>
      <section className="space-y-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-violet-300">Live Problem Engine</span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">Problemas en vivo</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">Mueve las variables del enunciado: el procedimiento, la revisión por pasos y la simulación se recalculan al instante.</p>
        </div>
        <Pills options={LIVE_PROBLEMS.map((p) => ({ id: p.id, label: p.title }))} value={prob} onChange={setProb} />
        <LiveProblem key={prob} problem={problem} />
      </section>
      <PaywallModal open={paywall} onClose={() => setPaywall(false)} />
    </div>
  );
}