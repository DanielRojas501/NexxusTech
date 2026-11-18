import { useState } from 'react';
import { BookMarked, Search } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { FORMULAS } from '@/data/formulas';
import { normalize } from '@/lib/check';

export default function FormulaSheet({ hud }) {
  const [q, setQ] = useState('');
  const groups = FORMULAS.map((g) => ({ ...g, items: g.items.filter((f) => normalize(f).includes(normalize(q))) })).filter((g) => g.items.length);
  return (
    <Sheet>
      <SheetTrigger asChild>
        {hud ? (
          <button title="Formulario" aria-label="Formulario"
            className="w-11 h-11 rounded-full border grid place-items-center bg-card/90 border-border text-muted-foreground hover:text-foreground hover:border-primary/50">
            <BookMarked className="w-5 h-5" />
          </button>
        ) : (
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm hover:bg-secondary/70"><BookMarked className="w-4 h-4" /> <span className="hidden sm:inline">Formulario</span></button>
        )}
      </SheetTrigger>
      <SheetContent className="bg-popover border-border overflow-y-auto">
        <SheetHeader><SheetTitle className="font-heading">Formulario</SheetTitle></SheetHeader>
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca una fórmula: ω₀, binomial, vpn…"
            className="w-full rounded-lg bg-slate-950/60 border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary" />
        </div>
        <div className="mt-4 space-y-6">
          {groups.length === 0 && <p className="text-sm text-muted-foreground">Sin resultados para “{q}”.</p>}
          {groups.map((g) => (
            <div key={g.group}>
              <div className="text-[11px] uppercase tracking-widest text-primary mb-2">{g.group}</div>
              <ul className="space-y-1.5">
                {g.items.map((f) => <li key={f} className="rounded-lg bg-slate-950/50 border border-border/50 px-3 py-2 font-mono text-sm text-slate-200">{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}