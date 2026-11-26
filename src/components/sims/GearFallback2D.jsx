import { useEffect, useRef } from 'react';

export default function GearFallback2D({ p }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const sc = 1.4;
    const rp1 = ((p.module * p.z1) / 2) * sc;
    const rp2 = ((p.module * p.z2) / 2) * sc;
    const x1 = 320 - rp1;
    const x2 = 320 + rp2;
    const cy = 190;
    const omega = (p.rpm * 2 * Math.PI) / 60;
    let theta = 0;
    let raf = 0;
    let last = performance.now();

    const drawTeeth = (cx, Z, off, thetaLocal, ra, rr, color) => {
      const step = (2 * Math.PI) / Z;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < Z; i++) {
        const a = off + thetaLocal + (i + 0.5) * step;
        ctx.beginPath();
        ctx.moveTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
        ctx.lineTo(cx + ra * Math.cos(a), cy + ra * Math.sin(a));
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    };

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      theta += omega * dt;
      const t2 = -(theta * p.z1) / p.z2;

      ctx.clearRect(0, 0, 640, 400);
      [x1, x2].forEach((cx, g) => {
        const rp = g === 0 ? rp1 : rp2;
        const m = p.module * sc;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = g === 0 ? '#C5A059' : '#D8B775';
        ctx.beginPath();
        ctx.arc(cx, cy, rp, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, rp + m, 0, Math.PI * 2);
        ctx.stroke();
      });
      drawTeeth(x1, p.z1, Math.PI / p.z1, theta, rp1 + p.module * sc, rp1 - 1.25 * p.module * sc, '#C5A059');
      drawTeeth(x2, p.z2, 0, t2, rp2 + p.module * sc, rp2 - 1.25 * p.module * sc, '#D8B775');

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(320, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(`i = Z₂/Z₁ = ${(p.z2 / p.z1).toFixed(2)}`, 12, 20);
      ctx.fillText(`ω₂ = ${(p.rpm * p.z1) / p.z2} RPM`, 12, 36);
      ctx.fillText(`T₂ = ${(p.torque * p.z2) / p.z1} N·m`, 12, 52);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [p]);

  return (
    <div className="rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden">
      <canvas ref={ref} width={640} height={400} className="w-full h-auto" />
      <p className="p-3 text-xs text-muted-foreground text-center">
        Modo compatible 2D — WebGL no está disponible en este navegador; se muestra el tren de engranes en Canvas HTML5.
      </p>
    </div>
  );
}