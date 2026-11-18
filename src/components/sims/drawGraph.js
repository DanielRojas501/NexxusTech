import { niceStep } from './draw';

export const XMIN = -4;
export const XMAX = 4;

export function drawGraph(ctx, w, h, { f, mode, x0, slope, rects }) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= 200; i++) { const y = f(XMIN + ((XMAX - XMIN) * i) / 200); if (isFinite(y)) { lo = Math.min(lo, y); hi = Math.max(hi, y); } }
  lo = Math.min(lo, 0); hi = Math.max(hi, 0);
  const pad = (hi - lo) * 0.12 || 1, ymin = lo - pad, ymax = hi + pad;
  const X = (x) => ((x - XMIN) / (XMAX - XMIN)) * w;
  const Y = (y) => h - ((y - ymin) / (ymax - ymin)) * h;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1; ctx.font = '10px "JetBrains Mono", monospace'; ctx.fillStyle = '#64748b';
  for (let x = XMIN; x <= XMAX; x++) {
    ctx.strokeStyle = x === 0 ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.08)';
    ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), h); ctx.stroke();
    if (x !== 0) ctx.fillText(x, X(x) + 3, Math.min(Math.max(Y(0) + 12, 12), h - 4));
  }
  const st = niceStep(ymax - ymin);
  for (let y = Math.ceil(ymin / st) * st; y <= ymax; y += st) {
    const zero = Math.abs(y) < st / 2;
    ctx.strokeStyle = zero ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.08)';
    ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(w, Y(y)); ctx.stroke();
    if (!zero) ctx.fillText(+y.toFixed(2), Math.min(Math.max(X(0) + 4, 4), w - 30), Y(y) - 3);
  }

  if (mode === 'riemann') {
    rects.forEach((r) => {
      ctx.fillStyle = r.y >= 0 ? 'rgba(167,139,250,0.22)' : 'rgba(248,113,113,0.2)';
      ctx.strokeStyle = r.y >= 0 ? '#B05064' : '#B05064';
      const top = Math.min(Y(0), Y(r.y)), ht = Math.abs(Y(r.y) - Y(0));
      ctx.fillRect(X(r.x), top, X(r.x + r.dx) - X(r.x), ht);
      ctx.strokeRect(X(r.x), top, X(r.x + r.dx) - X(r.x), ht);
    });
  }

  ctx.strokeStyle = '#C5A059'; ctx.lineWidth = 2.5; ctx.shadowColor = '#C5A059'; ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i <= 400; i++) { const x = XMIN + ((XMAX - XMIN) * i) / 400; i ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); }
  ctx.stroke(); ctx.shadowBlur = 0;

  if (mode === 'derivada') {
    const fx = f(x0);
    ctx.strokeStyle = '#D8B775'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(XMIN), Y(fx + slope * (XMIN - x0))); ctx.lineTo(X(XMAX), Y(fx + slope * (XMAX - x0))); ctx.stroke();
    ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(251,191,36,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(x0), Y(0)); ctx.lineTo(X(x0), Y(fx)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#D8B775'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(X(x0), Y(fx), 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}