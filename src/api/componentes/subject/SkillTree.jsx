import { Zap } from 'lucide-react';

export default function SkillTree({ subject, done = 0 }) {
  const total = subject.syllabus.length;
  const mastered = Math.min(done * 2, total);
  const W = 840, H = 300;
  const nodes = subject.syllabus.map((t, i) => ({
    t,
    x: 60 + (i * (W - 120)) / Math.max(total - 1, 1),
    y: i % 2 === 0 ? 100 : 220,
    status: i < mastered ? 'mastered' : 'pendiente',
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="font-mono text-cyan-300 flex items-center gap-1.5"><Zap className="w-4 h-4" /> {done} ejercicio{done === 1 ? '' : 's'} resuelto{done === 1 ? '' : 's'}</span>
        <span className="text-muted-foreground text-xs">Cada ejercicio correcto domina 2 nodos de la ruta</span>
        <span className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Dominado</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Pendiente · acceso libre</span>
        </span>
      </div>
      <div className="panel overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          {nodes.slice(0, -1).map((n, i) => (
            <line key={i} x1={n.x} y1={n.y} x2={nodes[i + 1].x} y2={nodes[i + 1].y}
              stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.6" />
          ))}
          {nodes.map((n, i) => (
            <g key={i}>
              {n.status === 'pendiente' && <circle cx={n.x} cy={n.y} r="34" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5"><animate attributeName="r" values="30;38;30" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" /></circle>}
              <circle cx={n.x} cy={n.y} r="26" fill={n.status === 'mastered' ? '#10b981' : '#06b6d4'} />
              {n.status === 'mastered'
                ? <path d={`M ${n.x - 9} ${n.y} l 6 7 l 12 -14`} fill="none" stroke="#052e2b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                : <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#083344" fontFamily="Space Grotesk">{i + 1}</text>}
              <text x={n.x} y={n.y > 150 ? n.y + 52 : n.y - 42} textAnchor="middle" fontSize="12.5"
                fill="#e2e8f0" fontFamily="Inter">
                {n.t.length > 24 ? n.t.slice(0, 23) + '…' : n.t}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}