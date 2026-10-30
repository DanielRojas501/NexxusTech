import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchX, ClipboardCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import Hero from '@/components/dashboard/Hero';
import MetricCards from '@/components/dashboard/MetricCards';
import AreaFilters from '@/components/dashboard/AreaFilters';
import SubjectCard from '@/components/dashboard/SubjectCard';
import { searchSubjects } from '@/data/subjects';
import { AREAS } from '@/data/areas';
import DoubtModule from '@/components/dashboard/DoubtModule';
import EvalModeReco from '@/components/dashboard/EvalModeReco';
import AdBanner from '@/components/monetization/AdBanner';
import PremiumPanel from '@/components/monetization/PremiumPanel';
import { isPremium } from '@/lib/monetization';

export default function Dashboard() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('todas');
  const results = useMemo(() => searchSubjects(query, area), [query, area]);
  const counts = useMemo(() => Object.fromEntries(AREAS.map((a) => [a.id, searchSubjects(query, a.id).length])), [query]);

  return (
    <div className="space-y-12">
      <Hero query={query} onQuery={setQuery} />
      {!isPremium(user) && <AdBanner variant="side" />}
      <DoubtModule />
      {user && !user.diagnostics_completed && (
        <Link to="/diagnostico" className="panel relative overflow-hidden p-5 sm:p-6 flex items-center gap-4 border-primary/30 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 hover:border-primary/60 transition-colors">
          <div className="w-11 h-11 shrink-0 rounded-xl grid place-items-center bg-primary/15 ring-1 ring-primary/30"><ClipboardCheck className="w-5 h-5 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Test diagnóstico de brechas</div>
            <p className="text-sm text-muted-foreground">5 preguntas de nivel prepa para trazar tu ruta personalizada. Ganas <span className="text-amber-300">+50 XP</span>.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-primary shrink-0" />
        </Link>
      )}
      <MetricCards />
      <EvalModeReco />
      <PremiumPanel user={user} />
      {!isPremium(user) && <AdBanner variant="foot" />}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Catálogo de materias</h2>
            <p className="text-sm text-muted-foreground mt-1">{results.length} {results.length === 1 ? 'materia' : 'materias'} {query && <>para “{query}”</>}</p>
          </div>
        </div>
        <AreaFilters value={area} onChange={setArea} counts={counts} />
        {results.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r, i) => <SubjectCard key={r.subject.id} subject={r.subject} matches={r.matches} index={i} />)}
          </div>
        ) : (
          <div className="panel py-16 text-center">
            <SearchX className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No encontramos materias o temas con esa búsqueda.</p>
          </div>
        )}
      </section>
    </div>
  );
}