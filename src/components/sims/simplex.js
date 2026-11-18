export const HEADERS = ['x₁', 'x₂', 's₁', 's₂', 's₃'];

const T0 = [
  [1, 0, 1, 0, 0, 4],
  [0, 2, 0, 1, 0, 12],
  [3, 2, 0, 0, 1, 18],
  [-3, -5, 0, 0, 0, 0],
];

export function simplexSteps() {
  let T = T0.map((r) => [...r]);
  const basis = ['s₁', 's₂', 's₃'];
  const steps = [];
  for (let it = 0; it < 10; it++) {
    const z = T[T.length - 1];
    let pc = -1, min = -1e-9;
    z.slice(0, -1).forEach((v, j) => { if (v < min) { min = v; pc = j; } });
    if (pc === -1) { steps.push({ T: T.map((r) => [...r]), basis: [...basis], pivotCol: null, pivotRow: null, ratios: null }); break; }
    const ratios = T.slice(0, -1).map((r) => (r[pc] > 1e-9 ? r[r.length - 1] / r[pc] : null));
    let pr = -1, best = Infinity;
    ratios.forEach((q, i) => { if (q !== null && q < best) { best = q; pr = i; } });
    steps.push({ T: T.map((r) => [...r]), basis: [...basis], pivotCol: pc, pivotRow: pr, ratios });
    const pv = T[pr][pc];
    const prow = T[pr].map((v) => v / pv);
    T = T.map((r, i) => (i === pr ? prow : r.map((v, j) => v - r[pc] * prow[j])));
    basis[pr] = HEADERS[pc];
  }
  return steps;
}

export const num = (v) => { const r = Math.round(v * 100) / 100; return Object.is(r, -0) ? 0 : r; };