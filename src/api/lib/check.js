export const parseNum = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
};

export const isClose = (u, t, tol = 0.015) =>
  u !== null && Math.abs(u - t) <= Math.max(Math.abs(t) * tol, 0.001);

export const fmt = (v, d = 3) => (Number.isFinite(v) ? String(Math.round(v * 10 ** d) / 10 ** d) : '—');

export const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();