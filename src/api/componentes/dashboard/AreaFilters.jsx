import { AREAS } from '@/data/areas';

export default function AreaFilters({ value, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
      {AREAS.map((a) => (
        <button
          key={a.id}
          onClick={() => onChange(a.id)}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all ${
            value === a.id ? 'bg-primary text-primary-foreground border-primary font-medium' : 'border-border/70 text-muted-foreground hover:text-foreground hover:border-border bg-card/40'
          }`}
        >
          {a.label}
          <span className={`text-[11px] font-mono ${value === a.id ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>{counts[a.id]}</span>
        </button>
      ))}
    </div>
  );
}