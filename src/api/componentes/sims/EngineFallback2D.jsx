import { useEffect, useRef } from 'react';

export default function EngineFallback2D({ p }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const r = p.stroke_mm / 2000;
    const L = p.rod_mm / 1000;
    const omega = (p.rpm * 2 * Math.PI) / 60;
    let theta = 0;
    let raf = 0;
    let last = performance.now();

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      theta += omega * dt;
      const s = 320;
      const cx = 320;
      const cy = 250;
      const yP = r * Math.cos(theta) + Math.sqrt(Math.max(L * L - r * r * Math.sin(theta) ** 2, 1e-9));

      ctx.clearRect(0, 0, 640, 400);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(cx, cy - L * s - 60);
      ctx.lineTo(cx, cy + r * s + 30);
      ctx.stroke();

      ctx.strokeStyle = '#C5A059';
      ctx.beginPath();
      ctx.arc(cx, cy, r * s, 0, Math.PI * 2);
      ctx.stroke();

      const px = cx + r * s * Math.cos(theta);
      const py = cy + r * s * Math.sin(theta);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx, cy - yP * s);
      ctx.stroke();
      ctx.lineWidth = 1;

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(cx - 26, cy - yP * s - 20, 52, 40);
      ctx.fillStyle = '#8a6f36';
      ctx.fillRect(cx - 26, cy - yP * s - 20, 52, 5);

      ctx.fillStyle = '#C5A059';
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(`θ = ${((theta * 180) / Math.PI).toFixed(0)}°`, 12, 20);
      ctx.fillText(`y pistón = ${(yP * 1000).toFixed(0)} mm`, 12, 36);
      ctx.fillText(`ω = ${omega.toFixed(1)} rad/s`, 12, 52);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p]);

  return (
    <div className="rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden">
      <canvas ref={ref} width={640} height={400} className="w-full h-auto" />
      <p className="p-3 text-xs text-muted-foreground text-center">
        Modo compatible 2D — WebGL no está disponible en este navegador; se muestra el mecanismo en Canvas HTML5.
      </p>
    </div>
  );
}