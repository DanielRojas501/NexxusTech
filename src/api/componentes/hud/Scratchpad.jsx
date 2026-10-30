import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, GripHorizontal, Eraser } from 'lucide-react';

const SIZE = { w: 280, h: 340 };

export default function Scratchpad({ onClose }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [width, setWidth] = useState(2);

  const ctx = () => ref.current.getContext('2d');
  const clear = () => { const c = ctx(); c.fillStyle = '#0f172a'; c.fillRect(0, 0, SIZE.w, SIZE.h); };

  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => { drawing.current = true; const c = ctx(); const [x, y] = pos(e); c.beginPath(); c.moveTo(x, y); };
  const move = (e) => {
    if (!drawing.current) return;
    const c = ctx();
    const [x, y] = pos(e);
    c.lineWidth = width; c.lineCap = 'round'; c.strokeStyle = '#C5A059';
    c.lineTo(x, y); c.stroke();
  };
  const up = () => { drawing.current = false; };

  return (
    <motion.div drag dragMomentum={false} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 right-4 z-50 rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 cursor-grab active:cursor-grabbing">
        <span className="flex items-center gap-2 text-xs text-muted-foreground"><GripHorizontal className="w-4 h-4" /> Scratchpad</span>
        <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-3 space-y-2" onPointerDownCapture={(e) => e.stopPropagation()}>
        <canvas ref={ref} {...SIZE} className="rounded-xl border border-border/60 touch-none cursor-crosshair"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); down(e); }}
          onPointerMove={move} onPointerUp={up} />
        <div className="flex items-center gap-2">
          <input type="range" min="1" max="8" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="flex-1 accent-cyan-400" />
          <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs hover:bg-secondary/70"><Eraser className="w-3.5 h-3.5" /> Limpiar</button>
        </div>
      </div>
    </motion.div>
  );
}
