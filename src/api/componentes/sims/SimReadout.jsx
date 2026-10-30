export default function SimReadout({ items }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-slate-950/50 border border-border/60 px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.label}</div>
          <div className={`font-mono text-sm mt-0.5 ${i.color || 'text-foreground'}`}>
            {i.value} <span className="text-muted-foreground text-xs">{i.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}