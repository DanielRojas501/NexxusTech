export const NODES = [
  { id: 's', x: 50, y: 150 }, { id: 'A', x: 190, y: 60 }, { id: 'B', x: 190, y: 240 },
  { id: 'C', x: 370, y: 60 }, { id: 'D', x: 370, y: 240 }, { id: 't', x: 510, y: 150 },
];

export const EDGES = [
  { u: 0, v: 1, cap: 10 }, { u: 0, v: 2, cap: 8 }, { u: 1, v: 2, cap: 2 }, { u: 1, v: 3, cap: 6 },
  { u: 1, v: 4, cap: 4 }, { u: 2, v: 4, cap: 9 }, { u: 4, v: 3, cap: 3 }, { u: 3, v: 5, cap: 8 }, { u: 4, v: 5, cap: 10 },
];

export function computeFlowSteps() {
  const n = NODES.length, s = 0, t = n - 1;
  const r = Array.from({ length: n }, () => Array(n).fill(0));
  EDGES.forEach((e) => { r[e.u][e.v] += e.cap; });
  const steps = [];
  let total = 0;
  for (;;) {
    const prev = Array(n).fill(-1); prev[s] = s;
    const q = [s];
    while (q.length && prev[t] === -1) {
      const u = q.shift();
      for (let v = 0; v < n; v++) if (prev[v] === -1 && r[u][v] > 0) { prev[v] = u; q.push(v); }
    }
    if (prev[t] === -1) break;
    const path = [t];
    while (path[0] !== s) path.unshift(prev[path[0]]);
    let b = Infinity;
    for (let i = 0; i < path.length - 1; i++) b = Math.min(b, r[path[i]][path[i + 1]]);
    for (let i = 0; i < path.length - 1; i++) { r[path[i]][path[i + 1]] -= b; r[path[i + 1]][path[i]] += b; }
    total += b;
    steps.push({ path, bottleneck: b, total, flows: EDGES.map((e) => Math.max(0, e.cap - r[e.u][e.v])) });
  }
  return steps;
}