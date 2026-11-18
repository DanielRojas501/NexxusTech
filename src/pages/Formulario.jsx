import { useState } from 'react';
import { Search, BookMarked } from 'lucide-react';
import { FORMULAS } from '@/data/formulas';
import { normalize } from '@/lib/check';

export default function Formulario() {
  const [q, setQ] = useState('');
  const groups = FORMULAS.map((g) => ({ ...g, items: g.items.filter((f) => normalize(f).includes(normalize(q))) })).filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-emerald-300 flex items-center gap-1.5">
          <BookMarked className="w-3.5 h-3.5" /> Índice libre
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-2">Formulario</h1>
        <p className="text-muted-foreground mt-2">Acceso directo a cualquier fórmula, sin necesidad de completar temas previos.</p>
      </div>
      <div className="relative max-w-xl">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca una fórmula: ω₀, binomial, vpn…"
          className="w-full rounded-lg bg-slate-950/60 border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div className="space-y-4">
        {groups.length === 0 && <div className="panel py-12 text-center text-sm text-muted-foreground">Sin resultados para “{q}”.</div>}
        {groups.map((g) => (
          <div key={g.group} className="panel p-5">
            <div className="text-[11px] uppercase tracking-widest text-primary mb-3">{g.group}</div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {g.items.map((f) => (
                <li key={f} className="rounded-lg bg-slate-950/50 border border-border/50 px-3 py-2 font-mono text-sm text-slate-200">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}