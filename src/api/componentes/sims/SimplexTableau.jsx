import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HEADERS, simplexSteps, num } from './simplex';

export default function SimplexTableau() {
  const steps = useMemo(simplexSteps, []);
  const [i, setI] = useState(0);
  const s = steps[i];
  const last = s.pivotCol === null;
  const zRow = s.T.length - 1;
  const val = (name) => { const r = s.basis.indexOf(name); return r >= 0 ? num(s.T[r][5]) : 0; };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-slate-950/60">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="px-3 py-2.5 text-left">Base</th>
              {HEADERS.map((h, j) => <th key={h} className={`px-3 py-2.5 ${j === s.pivotCol ? 'text-cyan-300 bg-cyan-400/10' : ''}`}>{h}</th>)}
              <th className="px-3 py-2.5">LD</th>
              {!last && <th className="px-3 py-2.5">Razón</th>}
            </tr>
          </thead>
          <tbody>
            {s.T.map((row, r) => (
              <tr key={r} className={`border-t border-border/40 transition-colors ${r === s.pivotRow ? 'bg-violet-500/15' : ''} ${r === zRow ? 'border-t-2 border-border' : ''}`}>
                <td className="px-3 py-2 text-left text-muted-foreground">{r === zRow ? 'Z' : s.basis[r]}</td>
                {row.slice(0, -1).map((v, j) => {
                  const isPivot = r === s.pivotRow && j === s.pivotCol;
                  return <td key={j} className={`px-3 py-2 text-center ${isPivot ? 'bg-amber-400/30 text-amber-100 font-bold' : j === s.pivotCol ? 'bg-cyan-400/10' : ''}`}>{num(v)}</td>;
                })}
                <td className="px-3 py-2 text-center">{num(row[5])}</td>
                {!last && <td className={`px-3 py-2 text-center ${r === s.pivotRow ? 'text-violet-300' : 'text-muted-foreground'}`}>{r < zRow && s.ratios[r] !== null ? num(s.ratios[r]) : '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {last
          ? <>Sin coeficientes negativos en la fila Z → <span className="text-emerald-300">solución óptima: x₁ = {val('x₁')}, x₂ = {val('x₂')}, Z = {num(s.T[zRow][5])}</span></>
          : <>Entra <span className="text-cyan-300">{HEADERS[s.pivotCol]}</span> (coeficiente más negativo {num(s.T[zRow][s.pivotCol])}), sale <span className="text-violet-300">{s.basis[s.pivotRow]}</span> (razón mínima {num(s.ratios[s.pivotRow])}). Elemento pivote: <span className="text-amber-300">{num(s.T[s.pivotRow][s.pivotCol])}</span>.</>}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Tabla {i + 1} de {steps.length}</span>
        <div className="flex gap-2">
          <button onClick={() => setI((v) => v - 1)} disabled={i === 0} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary text-xs disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" /> Anterior</button>
          <button onClick={() => setI((v) => v + 1)} disabled={i === steps.length - 1} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40">Pivotear <ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}