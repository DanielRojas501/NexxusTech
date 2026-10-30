import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { NODES, EDGES, computeFlowSteps } from './maxflow';

const COLORS = { idle: '#475569', flow: '#C5A059', path: '#fbbf24' };

export default function MaxFlowGraph() {
  const steps = useMemo(computeFlowSteps, []);
  const [idx, setIdx] = useState(-1);
  const [auto, setAuto] = useState(false);
  const cur = steps[idx];
  const done = idx === steps.length - 1;
  const flows = cur ? cur.flows : EDGES.map(() => 0);
  const pathSet = new Set(cur ? cur.path.slice(0, -1).map((u, i) => `${u}-${cur.path[i + 1]}`) : []);

  useEffect(() => {
    if (!auto) return;
    if (done) { setAuto(false); return; }
    const t = setTimeout(() => setIdx((i) => i + 1), 1300);
    return () => clearTimeout(t);
  }, [auto, idx, done]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-950/60 border border-border/60 overflow-hidden">
        <svg viewBox="0 0 560 300" className="w-full h-auto">
          <defs>
            {Object.entries(COLORS).map(([k, c]) => (
              <marker key={k} id={`ar-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={c} /></marker>
            ))}
          </defs>
          {EDGES.map((e, i) => {
            const a = NODES[e.u], b = NODES[e.v], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
            const state = pathSet.has(`${e.u}-${e.v}`) ? 'path' : flows[i] > 0 ? 'flow' : 'idle';
            const mx = (a.x + b.x) / 2 - uy * 14, my = (a.y + b.y) / 2 + ux * 14;
            return (
              <g key={i}>
                <line x1={a.x + ux * 22} y1={a.y + uy * 22} x2={b.x - ux * 24} y2={b.y - uy * 24} stroke={COLORS[state]} strokeWidth={state === 'path' ? 4 : 2.5} markerEnd={`url(#ar-${state})`} className={state !== 'idle' ? 'flow-dash' : ''} />
                <rect x={mx - 18} y={my - 10} width="36" height="20" rx="6" fill="#0f172a" stroke={flows[i] === e.cap ? '#B05064' : '#334155'} />
                <text x={mx} y={my + 4} textAnchor="middle" fontSize="11" fontFamily="JetBrains Mono" fill={flows[i] === e.cap ? '#D1939F' : '#cbd5e1'}>{flows[i]}/{e.cap}</text>
              </g>
            );
          })}
          {NODES.map((nd) => (
            <g key={nd.id}>
              <circle cx={nd.x} cy={nd.y} r="20" fill="#1e293b" stroke={nd.id === 's' || nd.id === 't' ? '#D8B775' : '#C5A059'} strokeWidth="2" />
              <text x={nd.x} y={nd.y + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="#e2e8f0" fontFamily="Space Grotesk">{nd.id}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {cur ? <>Camino <span className="font-mono text-amber-300">{cur.path.map((p) => NODES[p].id).join(' → ')}</span> · cuello de botella <span className="font-mono text-amber-300">{cur.bottleneck}</span></> : 'Pulsa "Paso" para buscar el primer camino aumentante.'}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm mr-2">Flujo: <span className={done ? 'text-emerald-300' : 'text-cyan-300'}>{cur ? cur.total : 0}</span>{done && ' (máximo)'}</span>
          <button onClick={() => setAuto((a) => !a)} disabled={done} className="p-2 rounded-lg bg-secondary hover:bg-secondary/70 disabled:opacity-40">{auto ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
          <button onClick={() => setIdx((i) => Math.min(i + 1, steps.length - 1))} disabled={done} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40"><SkipForward className="w-3.5 h-3.5" /> Paso</button>
          <button onClick={() => { setIdx(-1); setAuto(false); }} className="p-2 rounded-lg bg-secondary hover:bg-secondary/70"><RotateCcw className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}