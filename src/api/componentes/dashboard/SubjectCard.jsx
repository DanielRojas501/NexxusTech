import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Activity } from 'lucide-react';
import { ICONS } from '@/lib/icons';
import { AREA_STYLES, SIM_LABELS } from '@/data/areas';

export default function SubjectCard({ subject, matches, index }) {
  const st = AREA_STYLES[subject.area];
  const Icon = ICONS[subject.icon];
  const exercises = subject.modules.reduce((n, m) => n + m.exercises.length, 0);
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }}>
      <Link to={`/materia/${subject.id}`} className="group relative block h-full panel p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-card">
        <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${st.glow} to-transparent blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
        <div className="relative flex items-start justify-between">
          <div className={`w-11 h-11 rounded-xl grid place-items-center ring-1 ${st.bg} ${st.ring}`}>{Icon && <Icon className={`w-5 h-5 ${st.text}`} />}</div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="relative mt-5">
          <div className={`text-[11px] uppercase tracking-widest ${st.text}`}>{st.label}</div>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug">{subject.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{subject.description}</p>
        </div>
        {matches.length > 0 && (
          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {matches.slice(0, 3).map((m) => <span key={m} className="text-[11px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">{m}</span>)}
          </div>
        )}
        <div className="relative mt-5 pt-4 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{subject.syllabus.length} temas</span>
          <span>{exercises} ejercicios</span>
          {subject.sim && <span className="ml-auto flex items-center gap-1 text-emerald-300"><Activity className="w-3 h-3" />{SIM_LABELS[subject.sim]}</span>}
        </div>
      </Link>
    </motion.div>
  );
}