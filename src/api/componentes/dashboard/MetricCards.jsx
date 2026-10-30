import { motion } from 'framer-motion';
import { BookOpen, Layers, Activity, Target } from 'lucide-react';
import CountUp from './CountUp';
import { SUBJECTS, TOTAL_TOPICS } from '@/data/subjects';
import { SIMS } from '@/components/sims/registry';

const METRICS = [
  { icon: BookOpen, value: SUBJECTS.length, suffix: '', label: 'Materias de Tronco Común', color: 'text-cyan-300' },
  { icon: Layers, value: TOTAL_TOPICS, suffix: '+', label: 'Temas Teóricos', color: 'text-violet-300' },
  { icon: Activity, value: Object.keys(SIMS).filter((k) => k !== 'riemann').length, suffix: '', label: 'Simuladores Visuales 2D/3D Activos', color: 'text-emerald-300', live: true },
  { icon: Target, value: 450, suffix: '+', label: 'Ejercicios Prácticos', color: 'text-amber-300' },
];

export default function MetricCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {METRICS.map((m, i) => (
        <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <m.icon className={`w-5 h-5 ${m.color}`} />
            {m.live && <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-300"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span>}
          </div>
          <div className="mt-4 font-heading text-3xl sm:text-4xl font-bold tabular-nums"><CountUp to={m.value} />{m.suffix}</div>
          <div className="mt-1 text-xs sm:text-sm text-muted-foreground leading-snug">{m.label}</div>
        </motion.div>
      ))}
    </div>
  );
}