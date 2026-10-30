import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { searchAll, RESULT_STYLES } from '@/data/searchIndex';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const results = useMemo(() => (open ? searchAll(q) : []), [q, open]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
          <Search className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline truncate">Buscar temas, fórmulas, simulaciones…</span>
          <kbd className="hidden md:inline-flex ml-auto rounded bg-slate-950/60 border border-border px-1.5 font-mono text-[10px]">Ctrl K</kbd>
        </button>
      </DialogTrigger>
      <DialogContent className="bg-popover border-border max-w-xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Búsqueda global</DialogTitle>
          <DialogDescription>Accede directo a cualquier tema, fórmula, simulación o problema, sin completar temas previos.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca cualquier tema, fórmula, simulación 3D o problema…"
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sin resultados para “{q}”.</p>}
          <div className="space-y-1">
            {results.map((r, i) => (
              <Link
                key={i}
                to={r.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary transition-colors"
              >
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wide ${RESULT_STYLES[r.type]?.bg} ${RESULT_STYLES[r.type]?.text}`}>
                  {r.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{r.title}</span>
                  {r.subtitle && <span className="block truncate text-xs text-muted-foreground">{r.subtitle}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}