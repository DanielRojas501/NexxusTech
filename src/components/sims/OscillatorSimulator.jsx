import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import useCanvas from './useCanvas';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import SimShell from './SimShell';
import { drawOscillator } from './drawOscillator';

const H = 300;

export default function OscillatorSimulator({ mass, k, amplitude, lockMode, initialMode = 'resorte' }) {
  const [mode, setMode] = useState(lockMode || initialMode);
  const [m, setM] = useState(2);
  const [kk, setK] = useState(50);
  const [c, setC] = useState(0.2);
  const [A, setA] = useState(0.2);
  const [L, setL] = useState(1.5);
  const [th0, setTh0] = useState(30);
  const P = { mode, m: mass ?? m, k: k ?? kk, c: lockMode ? 0 : c, A: amplitude ?? A, L, th0 };
  const { wrapRef, canvasRef, width } = useCanvas(H);
  const live = useRef({});
  live.current = { ...P, width };
  const sim = useRef({ x: 0, v: 0, hist: [] });

  const reset = () => {
    const p = live.current;
    sim.current = { x: p.mode === 'resorte' ? p.A : (p.th0 * Math.PI) / 180, v: 0, hist: [] };
  };
  useEffect(reset, [P.mode, P.A, P.th0, P.L]);

  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04); last = now;
      const p = live.current, s = sim.current, h = dt / 8;
      for (let i = 0; i < 8; i++) {
        const acc = p.mode === 'resorte' ? (-p.k * s.x - p.c * s.v) / p.m : -(9.81 / p.L) * Math.sin(s.x) - p.c * s.v;
        s.v += acc * h; s.x += s.v * h;
      }
      s.hist.push(s.x); if (s.hist.length > 240) s.hist.shift();
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && p.width) drawOscillator(ctx, p.width, H, p, s);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const w0 = mode === 'resorte' ? Math.sqrt(P.k / P.m) : Math.sqrt(9.81 / L);
  const items = mode === 'resorte'
    ? [{ label: 'ω₀', value: w0.toFixed(2), unit: 'rad/s', color: 'text-cyan-300' }, { label: 'Periodo T', value: ((2 * Math.PI) / w0).toFixed(3), unit: 's' }, { label: 'Frecuencia', value: (w0 / (2 * Math.PI)).toFixed(3), unit: 'Hz' }, { label: 'ζ amortig.', value: (P.c / (2 * Math.sqrt(P.k * P.m))).toFixed(3), unit: '', color: 'text-violet-300' }]
    : [{ label: 'ω ≈ √(g/L)', value: w0.toFixed(2), unit: 'rad/s', color: 'text-cyan-300' }, { label: 'Periodo T', value: ((2 * Math.PI) / w0).toFixed(3), unit: 's' }, { label: 'Longitud', value: L.toFixed(2), unit: 'm' }, { label: 'θ₀', value: th0, unit: '°', color: 'text-violet-300' }];

  return (
    <SimShell title={mode === 'resorte' ? 'Oscilador masa-resorte' : 'Péndulo simple'} subtitle={mode === 'resorte' ? 'm·x″ + c·x′ + k·x = 0' : 'θ″ + (g/L)·sin θ = 0'}>
      {!lockMode && (
        <div className="inline-flex p-1 rounded-lg bg-slate-950/60 border border-border/60 text-xs">
          {['resorte', 'pendulo'].map((id) => (
            <button key={id} onClick={() => setMode(id)} className={`px-3 py-1.5 rounded-md transition-colors ${mode === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{id === 'resorte' ? 'Masa-resorte' : 'Péndulo'}</button>
          ))}
        </div>
      )}
      <div ref={wrapRef} className="rounded-xl bg-slate-950/60 border border-border/60 overflow-hidden"><canvas ref={canvasRef} className="block" /></div>
      <SimReadout items={items} />
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
        {mode === 'resorte' ? (<>
          {mass === undefined && <ParamSlider label="Masa m" value={m} unit="kg" min={0.5} max={5} step={0.5} onChange={setM} />}
          {k === undefined && <ParamSlider label="Constante k" value={kk} unit="N/m" min={10} max={200} step={10} onChange={setK} />}
          {amplitude === undefined && <ParamSlider label="Amplitud inicial" value={A} unit="m" min={0.05} max={0.3} step={0.05} onChange={setA} />}
        </>) : (<>
          <ParamSlider label="Longitud L" value={L} unit="m" min={0.5} max={3} step={0.1} onChange={setL} />
          <ParamSlider label="Ángulo inicial θ₀" value={th0} unit="°" min={5} max={80} step={5} onChange={setTh0} />
        </>)}
        {!lockMode && <ParamSlider label="Amortiguamiento c" value={c} unit="" min={0} max={2} step={0.1} onChange={setC} />}
      </div>
      <button onClick={reset} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="w-3.5 h-3.5" /> Soltar de nuevo</button>
    </SimShell>
  );
}