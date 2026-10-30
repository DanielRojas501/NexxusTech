export function drawOscillator(ctx, w, h, p, s) {
  ctx.clearRect(0, 0, w, h);
  const lw = Math.floor(w * 0.55);
  const cy = h / 2;
  if (p.mode === 'resorte') {
    const eq = lw * 0.55, scale = lw * 0.9, bx = eq + s.x * scale;
    ctx.fillStyle = '#334155'; ctx.fillRect(10, cy - 60, 10, 120);
    ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(eq, cy - 50); ctx.lineTo(eq, cy + 50); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(20, cy + 24); ctx.lineTo(lw - 10, cy + 24); ctx.strokeStyle = '#334155'; ctx.stroke();
    const x0 = 20, x1 = bx - 22, coils = 14;
    ctx.strokeStyle = '#D8B775'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, cy);
    for (let i = 1; i <= coils; i++) ctx.lineTo(x0 + ((x1 - x0) * (i - 0.5)) / coils, cy + (i % 2 ? -12 : 12));
    ctx.lineTo(x1, cy); ctx.stroke();
    const g = ctx.createLinearGradient(bx - 22, 0, bx + 22, 0);
    g.addColorStop(0, '#987836'); g.addColorStop(1, '#C5A059');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(bx - 22, cy - 22, 44, 44, 8); ctx.fill();
    ctx.fillStyle = '#0f172a'; ctx.font = '600 11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${p.m}kg`, bx, cy + 4); ctx.textAlign = 'left';
  } else {
    const px = lw / 2, py = 26, Lp = 40 + p.L * 70, bx = px + Lp * Math.sin(s.x), by = py + Lp * Math.cos(s.x);
    ctx.fillStyle = '#334155'; ctx.fillRect(px - 40, py - 6, 80, 6);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.arc(px, py, Lp, Math.PI / 2 - (p.th0 * Math.PI) / 180, Math.PI / 2 + (p.th0 * Math.PI) / 180); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#D8B775'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = '#C5A059'; ctx.shadowColor = '#C5A059'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(bx, by, 14, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  const gx = lw + 12, gw = w - lw - 24, ref = p.mode === 'resorte' ? p.A : (p.th0 * Math.PI) / 180;
  ctx.fillStyle = 'rgba(15,23,42,0.6)'; ctx.fillRect(gx, 16, gw, h - 32);
  ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(gx + gw, cy); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(p.mode === 'resorte' ? 'x(t)' : 'θ(t)', gx + 8, 32);
  ctx.strokeStyle = '#C5A059'; ctx.lineWidth = 2; ctx.beginPath();
  s.hist.forEach((v, i) => { const x = gx + (i / 240) * gw, y = cy - (v / ref) * (h * 0.36); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.stroke();
}