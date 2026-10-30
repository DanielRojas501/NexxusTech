import { BadgeCheck, CalendarPlus, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TutorCard({ tutor, onBook }) {
  const subjects = tutor.subjects_offered || [];
  return (
    <div className="panel p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-guindo-600 to-dorado-500 grid place-items-center text-primary-foreground font-bold text-sm">
          {(tutor.full_name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold truncate">{tutor.full_name}</span>
            {tutor.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-verde-500/15 text-verde-400 px-2 py-0.5 text-[10px] font-medium">
                <BadgeCheck className="w-3 h-3" /> Verificado
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{tutor.credential}</div>
        </div>
      </div>

      {tutor.sponsored && (
        <span className="self-start inline-flex items-center gap-1 rounded-full bg-dorado-500/15 text-dorado-300 px-2.5 py-0.5 text-[11px] font-medium">
          <Star className="w-3 h-3" /> Patrocinado
        </span>
      )}

      <p className="text-sm text-muted-foreground line-clamp-3">{tutor.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {subjects.map((s) => (
          <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">{s}</span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <div className="text-xs font-mono text-muted-foreground flex flex-col gap-0.5">
          <span className="text-base font-semibold text-foreground">${tutor.hourly_rate}<span className="text-xs font-normal">/h</span></span>
          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-dorado-300" />{Number(tutor.rating || 5).toFixed(1)} · {tutor.total_sessions || 0} <Clock className="w-3 h-3" /> sesiones</span>
        </div>
        <Button size="sm" onClick={() => onBook(tutor)}>
          <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Agendar
        </Button>
      </div>
    </div>
  );
}