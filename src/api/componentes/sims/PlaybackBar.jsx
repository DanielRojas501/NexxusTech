import { Pause, Play, Redo2, Undo2 } from 'lucide-react';

const CTRL =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-border/70 bg-secondary/60 hover:bg-secondary transition-colors';

export default function PlaybackBar({ playing, reverse, phase, onToggle, onStep, onReverse, onScrub }) {
  const deg = phase != null && Number.isFinite(phase) ? Math.round(phase * 360) : 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={`${CTRL} ${playing ? '' : 'text-primary border-primary/50'}`} onClick={onToggle}>
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        {playing ? 'Pausar' : 'Reanudar'}
      </button>
      <button className={CTRL} onClick={onStep}>
        <Redo2 className="w-3.5 h-3.5" /> Paso a paso
      </button>
      <button className={`${CTRL} ${reverse ? 'text-amber-300 border-amber-400/50' : ''}`} onClick={onReverse}>
        <Undo2 className="w-3.5 h-3.5" /> Reversa
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-[170px]">
        <span className="text-[10px] font-mono text-muted-foreground w-10">{deg}°</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round((phase ?? 0) * 1000)}
          onChange={(e) => onScrub(Number(e.target.value) / 1000)}
          className="flex-1 h-1.5 accent-cyan-400 cursor-pointer"
          aria-label="Barra de tiempo de animación"
        />
      </div>
    </div>
  );
}