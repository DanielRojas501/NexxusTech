import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ICONS } from '@/lib/icons';
import { AREA_STYLES } from '@/data/areas';

export default function SubjectHeader({ subject }) {
  const st = AREA_STYLES[subject.area];
  const Icon = ICONS[subject.icon];
  const exercises = subject.modules.reduce((n, m) => n + m.exercises.length, 0);
  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Materias</Link>
      <div className="relative panel p-6 sm:p-8 overflow-hidden">
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br ${st.glow} to-transparent blur-3xl`} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl grid place-items-center ring-1 ${st.bg} ${st.ring}`}>{Icon && <Icon className={`w-7 h-7 ${st.text}`} />}</div>
          <div className="flex-1">
            <div className={`text-xs uppercase tracking-widest ${st.text}`}>{st.label}</div>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">{subject.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">{subject.description}</p>
          </div>
          <div className="flex sm:flex-col gap-4 sm:gap-1 sm:text-right font-mono text-sm">
            <span><span className="text-foreground">{subject.syllabus.length}</span> <span className="text-muted-foreground">temas</span></span>
            <span><span className="text-foreground">{subject.modules.length}</span> <span className="text-muted-foreground">módulos</span></span>
            <span><span className="text-foreground">{exercises}</span> <span className="text-muted-foreground">ejercicios</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}