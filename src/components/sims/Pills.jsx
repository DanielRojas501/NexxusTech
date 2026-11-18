export default function Pills({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap p-1 rounded-lg bg-slate-950/60 border border-border/60 text-xs gap-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md transition-all ${value === o.id ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}