export default function Syllabus({ subject }) {
  const covered = new Set(subject.modules.map((m) => m.title));
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {subject.syllabus.map((t, i) => (
        <div key={t} className="panel px-4 py-3.5 flex items-center gap-4">
          <span className="font-mono text-xs text-primary w-6">{String(i + 1).padStart(2, '0')}</span>
          <span className="text-sm">{t}</span>
        </div>
      ))}
      <p className="sm:col-span-2 text-xs text-muted-foreground mt-2">
        Módulos interactivos disponibles: {[...covered].join(' · ')}.
      </p>
    </div>
  );
}