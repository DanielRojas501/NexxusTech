export default function SimHUD({ items }) {
  return (
    <div className="absolute top-3 right-3 z-10 pointer-events-none">
      <div className="rounded-xl border border-border/70 bg-slate-950/85 backdrop-blur px-3 py-2.5 shadow-xl">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-verde-400 animate-pulse" /> Telemetría en vivo
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
          {items.map((it) => (
            <div key={it.label}>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/80">{it.label}</div>
              <div className={it.color || 'text-foreground'}>
                {it.value}
                {it.unit && <span className="text-muted-foreground text-[10px] ml-1">{it.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}