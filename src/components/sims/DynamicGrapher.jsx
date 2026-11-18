import { useEffect, useMemo, useState } from 'react';
import useCanvas from './useCanvas';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import SimShell from './SimShell';
import Pills from './Pills';
import { drawGraph, XMIN, XMAX } from './drawGraph';

const H = 340;
const FUNCS = [
  { id: 'poly', label: 'f(x) = x³ − 3x', f: (x) => x ** 3 - 3 * x },
  { id: 'sin', label: 'f(x) = sin(x) + 2', f: (x) => Math.sin(x) + 2 },
  { id: 'quad', label: 'f(x) = 0.5x² + 1', f: (x) => 0.5 * x * x + 1 },
  { id: 'exp', label: 'f(x) = eˣ / 2', f: (x) => Math.exp(x) / 2 },
];

const simpson = (f, a, b, n = 1000) => {
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};

export default function DynamicGrapher({ initialMode = 'derivada', lockMode, customFn, x0: x0Prop, onX0Change }) {
  const [mode, setMode] = useState(lockMode || initialMode);
  const [fnId, setFnId] = useState('poly');
  const [innerX0, setInnerX0] = useState(1);
  const x0 = x0Prop ?? innerX0;
  const setX0 = onX0Change ?? setInnerX0;
  const [n, setN] = useState(8);
  const [a, setA] = useState(-2);
  const [b, setB] = useState(2);
  const [method, setMethod] = useState('mid');
  const fn = customFn || FUNCS.find((f) => f.id === fnId);
  const { wrapRef, canvasRef, width } = useCanvas(H);
  const lo = Math.min(a, b), hi = Math.max(a, b);

  const slope = (fn.f(x0 + 1e-4) - fn.f(x0 - 1e-4)) / 2e-4;
  const riemann = useMemo(() => {
    const dx = (hi - lo) / n, off = { left: 0, mid: 0.5, right: 1 }[method];
    let sum = 0; const rects = [];
    for (let i = 0; i < n; i++) { const xi = lo + (i + off) * dx; const y = fn.f(xi); sum += y * dx; rects.push({ x: lo + i * dx, dx, y }); }
    return { sum, rects, exact: simpson(fn.f, lo, hi) };
  }, [fn.label, lo, hi, n, method]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && width) drawGraph(ctx, width, H, { f: fn.f, mode, x0, slope, rects: riemann.rects });
  });

  const onPointer = (e) => {
    if (mode !== 'derivada' || (e.type === 'pointermove' && e.buttons !== 1)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setX0(Math.round((XMIN + ((e.clientX - rect.left) / rect.width) * (XMAX - XMIN)) * 20) / 20);
  };

  return (
    <SimShell title={mode === 'derivada' ? 'Graficador: recta tangente' : 'Graficador: sumas de Riemann'} subtitle={fn.label}>
      <div className="flex flex-wrap gap-2">
        {!lockMode && <Pills options={[{ id: 'derivada', label: 'Derivada' }, { id: 'riemann', label: 'Riemann' }]} value={mode} onChange={setMode} />}
        {!customFn && <Pills options={FUNCS.map((f) => ({ id: f.id, label: f.label.replace('f(x) = ', '') }))} value={fnId} onChange={setFnId} />}
      </div>
      <div ref={wrapRef} className="rounded-xl bg-slate-950/60 border border-border/60 overflow-hidden">
        <canvas ref={canvasRef} className={`block ${mode === 'derivada' ? 'cursor-crosshair' : ''}`} style={{ touchAction: 'none' }} onPointerDown={onPointer} onPointerMove={onPointer} />
      </div>
      {mode === 'derivada' ? (<>
        <SimReadout items={[
          { label: 'x₀', value: x0.toFixed(2), unit: '' },
          { label: 'f(x₀)', value: fn.f(x0).toFixed(3), unit: '', color: 'text-cyan-300' },
          { label: "m = f′(x₀)", value: slope.toFixed(3), unit: '', color: 'text-amber-300' },
          { label: 'Tangente', value: `y = ${slope.toFixed(2)}x ${fn.f(x0) - slope * x0 >= 0 ? '+' : '−'} ${Math.abs(fn.f(x0) - slope * x0).toFixed(2)}`, unit: '' },
        ]} />
        <ParamSlider label="Punto de tangencia x₀ (o arrastra sobre la gráfica)" value={x0} min={-3.9} max={3.9} step={0.05} onChange={setX0} />
      </>) : (<>
        <SimReadout items={[
          { label: 'Σ Riemann', value: riemann.sum.toFixed(4), unit: 'u²', color: 'text-violet-300' },
          { label: '∫ exacta', value: riemann.exact.toFixed(4), unit: 'u²', color: 'text-cyan-300' },
          { label: 'Error', value: Math.abs(riemann.sum - riemann.exact).toFixed(4), unit: '' },
          { label: 'Δx', value: ((hi - lo) / n).toFixed(3), unit: '' },
        ]} />
        <Pills options={[{ id: 'left', label: 'Izquierda' }, { id: 'mid', label: 'Punto medio' }, { id: 'right', label: 'Derecha' }]} value={method} onChange={setMethod} />
        <div className="grid sm:grid-cols-3 gap-4">
          <ParamSlider label="Rectángulos n" value={n} min={1} max={60} step={1} onChange={setN} />
          <ParamSlider label="Límite a" value={a} min={-4} max={4} step={0.5} onChange={setA} />
          <ParamSlider label="Límite b" value={b} min={-4} max={4} step={0.5} onChange={setB} />
        </div>
      </>)}
    </SimShell>
  );
}