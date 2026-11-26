export function drawArrow(ctx, x1, y1, x2, y2, color, label, width = 3) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hl = 10;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(ang - 0.4), y2 - hl * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - hl * Math.cos(ang + 0.4), y2 - hl * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  if (label) {
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(label, x2 + 10 * Math.cos(ang) - 4, y2 + 10 * Math.sin(ang) + 4);
  }
}

export function niceStep(range) {
  const raw = range / 8;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}