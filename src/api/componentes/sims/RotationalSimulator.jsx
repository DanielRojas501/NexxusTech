import { useEffect, useRef, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';
import useCanvas from './useCanvas';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import SimShell from './SimShell';
import { drawArrow } from './draw';

const H = 340;

function draw(ctx, w, h, theta, omega, r) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.32;
  ctx.strokeStyle = 'rgba(148,163,184,0.18)';
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 3; i++) {
    const a = theta + (i * 2 * Math.PI) / 3;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, R, 0);
    g.addColorStop(0, '#334155'); g.addColorStop(1, i === 0 ? '#C5A059' : '#64748b');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(R / 2, 0, R / 2, R * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#C5A059'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const tx = cx + R * Math.cos(theta), ty = cy + R * Math.sin(theta);
  const v = omega * r, ac = omega * omega * r;
  const vl = Math.min(20 + v * 5, 150), al = Math.min(15 + Math.sqrt(ac) * 5, R * 0.85);
  drawArrow(ctx, tx, ty, tx - Math.sin(theta) * vl, ty + Math.cos(theta) * vl, '#6FA37C', 'v');
  drawArrow(ctx, tx, ty, tx - Math.cos(theta) * al, ty - Math.sin(theta) * al, '#B05064', 'a꜀');
  ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill();
}

export default function RotationalSimulator({ rpm: rpmProp, onRpmChange, rpmMin = 0, rpmMax = 1200, radius = 0.5, alpha = 3 }) {
  const [innerRpm, setInnerRpm] = useState(180);
  const rpm = rpmProp ?? innerRpm;
  const setRpm = onRpmChange ?? setInnerRpm;
  const [accelerate, setAccelerate] = useState(false);
  const [slow, setSlow] = useState(false);
  const [extra, setExtra] = useState(0);
  const { wrapRef, canvasRef, width } = useCanvas(H);
  const live = useRef({});
  live.current = { rpm, radius, alpha, accelerate, slow, width };
  const sim = useRef({ theta: 0, extra: 0, lastUi: 0 });

  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const p = live.current, s = sim.current;
      if (p.accelerate) s.extra = Math.min(s.extra + p.alpha * dt, 150);
      const omega = (2 * Math.PI * p.rpm) / 60 + s.extra;
      s.theta += omega * dt * (p.slow ? 0.1 : 1);
      if (now - s.lastUi > 120) { s.lastUi = now; setExtra(s.extra); }
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && p.width) draw(ctx, p.width, H, s.theta, omega, p.radius);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const w0 = (2 * Math.PI * rpm) / 60;
  const w = w0 + extra;
  const reset = () => { sim.current.extra = 0; setExtra(0); };

  return (
    <SimShell title="Simulador de rotación" subtitle={`Hélice de r = ${radius} m · vector v (verde) y a꜀ (rojo)`}>
      <div ref={wrapRef} className="rounded-xl bg-slate-950/60 border border-border/60 overflow-hidden">
        <canvas ref={canvasRef} className="block" />
      </div>
      <SimReadout items={[
        { label: 'ω actual', value: w.toFixed(2), unit: 'rad/s', color: 'text-cyan-300' },
        { label: 'RPM efectivas', value: ((w * 60) / (2 * Math.PI)).toFixed(0), unit: 'rpm' },
        { label: 'v tangencial', value: (w * radius).toFixed(2), unit: 'm/s', color: 'text-green-400' },
        { label: 'a centrípeta', value: (w * w * radius).toFixed(1), unit: 'm/s²', color: 'text-red-400' },
      ]} />
      <ParamSlider label="Velocidad base" value={rpm} unit="RPM" min={rpmMin} max={rpmMax} step={10} onChange={setRpm} />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground"><Switch checked={accelerate} onCheckedChange={setAccelerate} /> Aplicar α = {alpha} rad/s²</label>
        <label className="flex items-center gap-2 text-muted-foreground"><Switch checked={slow} onCheckedChange={setSlow} /> Cámara lenta ×0.1</label>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="w-3.5 h-3.5" /> Reiniciar α</button>
      </div>
    </SimShell>
  );
}