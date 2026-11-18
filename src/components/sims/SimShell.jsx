export default function SimShell({ title, subtitle, children }) {
  return (
    <div className="panel p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En vivo
        </span>
      </div>
      {children}
    </div>
  );
}