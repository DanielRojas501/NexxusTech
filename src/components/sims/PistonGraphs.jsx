import { useEffect, useRef } from 'react';

// Gráficas de posición, velocidad y aceleración del pistón sincronizadas
// con la fase del cigüeñal en la escena 3D (marcador en tiempo real).
export default function PistonGraphs({ r_m, L_m, omega, phase }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth || 320;
    const H = 168;
    canvas.width = w * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, H);

    const h = 1e-3;
    const N = 160;
    const yOf = (th) => r_m * Math.cos(th) + Math.sqrt(Math.max(L_m * L_m - r_m * r_m * Math.sin(th) ** 2, 1e-12));
    const series = [];
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const y = yOf(th);
      const v = omega * (yOf(th + h) - yOf(th - h)) / (2 * h);
      const a = omega * omega * (yOf(th + h) - 2 * y + yOf(th - h)) / (h * h);
      series.push([y * 1000, v, a]);
    }

    const panels = [
      { label: 'Posición (mm)', color: '#C5A059', data: series.map((s) => s[0]) },
      { label: 'Velocidad (m/s)', color: '#D8B775', data: series.map((s) => s[1]) },
      { label: 'Aceleración (m/s²)', color: '#9CC2A4', data: series.map((s) => s[2]) },
    ];
    const ph = (panel, i) => 6 + panel * (H / 3) + i * (H / 3 - 8);

    panels.forEach((p, pi) => {
      const yTop = ph(pi, 0);
      const yBot = ph(pi, 1);
      const min = Math.min(...p.data);
      const max = Math.max(...p.data);
      const span = max - min || 1;
      ctx.strokeStyle = 'rgba(148,163,184,0.18)';
      ctx.strokeRect(0.5, yTop + 0.5, w - 1, yBot - yTop - 1);
      ctx.beginPath();
      p.data.forEach((d, i) => {
        const x = (i / N) * (w - 8) + 4;
        const y = yBot - 3 - ((d - min) / span) * (yBot - yTop - 8);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.fillStyle = 'rgba(226,232,240,0.85)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.fillText(p.label, 6, yTop + 10);
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.fillText(max.toFixed(1), w - 34, yTop + 10);
      // marcador de fase actual (sincronizado con el 3D)
      const mx = (phase ?? 0) * (w - 8) + 4;
      ctx.strokeStyle = 'rgba(251,191,36,0.9)';
      ctx.beginPath();
      ctx.moveTo(mx, yTop + 2);
      ctx.lineTo(mx, yBot - 2);
      ctx.stroke();
    });
  }, [r_m, L_m, omega, phase]);

  return (
    <div className="panel p-2">
      <canvas ref={ref} className="w-full block" style={{ height: 168 }} />
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Cinemática del pistón en un ciclo completo · <span className="text-amber-300">▍</span> = fase actual del cigüeñal
      </p>
    </div>
  );
}