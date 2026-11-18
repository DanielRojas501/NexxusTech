import { useEffect, useRef, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import SimShell from './SimShell';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import SimHUD from './SimHUD';
import Pills from './Pills';
import FailureBanner from './FailureBanner';
import { createTrussScene } from './trussScene';
import useWebglScene from './useWebglScene';
import SceneCanvas from '@/components/sims/SceneCanvas';
import { setSimSnapshot } from '@/lib/simState';

const MODES = [
  { id: 'tc', label: 'Tensión (azul) / compresión (rojo)' },
  { id: 'vm', label: 'Mapa de calor Von Mises' },
  { id: 'steel', label: 'Perfil de acero' },
];

export default function TrussSimulator() {
  const mountRef = useRef(null);
  const [p, setP] = useState({ loadKilo: 20, loadNode: 2, loadType: 'puntual' });
  const [mode, setMode] = useState('tc');
  const [exag, setExag] = useState(10);
  const [tele, setTele] = useState(null);
  const [tip, setTip] = useState(null);
  const { sceneRef, failed, revision, retryScene } = useWebglScene({
    create: createTrussScene,
    mountRef,
    onTelemetry: setTele,
    onHover: setTip,
  });

  useEffect(() => {
    sceneRef.current?.setState(p);
  }, [p, revision]);
  useEffect(() => {
    sceneRef.current?.setState({ mode });
  }, [mode, revision]);
  useEffect(() => {
    sceneRef.current?.setState({ exag });
  }, [exag, revision]);
  useEffect(() => {
    setSimSnapshot(
      'truss',
      `Simulador armadura: carga=${p.loadKilo} kN (${p.loadType}), σ_max=${tele ? tele.maxStress.toFixed(0) : '—'} MPa, deformación exagerada ×${exag}${tele?.maxStress > 150 ? ' (LÍMITE ELÁSTICO EXCEDIDO)' : ''}`
    );
  }, [p, tele, exag]);

  const fmt = (v, d = 2) => (tele && Number.isFinite(v) ? v.toFixed(d) : '—');
  const over = tele && tele.maxStress > 150;
  const modeLabel = MODES.find((m) => m.id === mode)?.label;

  const hudItems = tele
    ? [
        { label: 'Esfuerzo máx', value: fmt(tele.maxStress, 1), unit: 'MPa', color: over ? 'text-guindo-400' : 'text-guindo-300' },
        { label: 'Carga total', value: fmt(tele.loadKilo, 0), unit: 'kN', color: 'text-dorado-300' },
        { label: 'Fuerza máx |N|', value: fmt(tele.maxN, 1), unit: 'kN', color: 'text-dorado-300' },
        { label: 'Deformación', value: fmt(tele.maxDispMm, 3), unit: 'mm', color: 'text-guindo-300' },
      ]
    : [];

  return (
    <SimShell
      title="Armadura (cercha) · Análisis estructural 3D"
      subtitle="Fuerzas puntuales o distribuidas · deformación exagerada real (FEA) · toca un miembro o nodo"
    >

        <div
          ref={mountRef}
          className="relative h-[360px] sm:h-[440px] rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden touch-none"
        >
          <SceneCanvas label="Armadura 3D interactiva" />
          <div className="absolute top-3 left-3 z-10 rounded-lg bg-slate-950/80 border border-border/60 px-3 py-2 text-[11px] space-y-1 pointer-events-none">
            {mode === 'vm' && (
              <div className="flex items-center gap-2">
                <span className="w-8 h-2 rounded-sm" style={{ background: 'linear-gradient(90deg,#7C93AC,#fbbf24,#B05064)' }} />
                <span className="text-muted-foreground">esfuerzo bajo → alto (σ_vm)</span>
              </div>
            )}
            {mode === 'tc' && (
              <>
                <div className="flex items-center gap-2 text-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400" /> tensión (estiramiento)
                </div>
                <div className="flex items-center gap-2 text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> compresión (acortamiento)
                </div>
              </>
            )}
            {mode === 'steel' && (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> perfil de acero estructural tipo I
              </div>
            )}
            <div className="flex items-center gap-2 text-verde-300">
              <span className="w-2 h-2 rounded-full bg-verde-400" /> reacciones · <span className="w-2 h-2 rounded-full bg-dorado-400 ml-1" /> carga
            </div>
          </div>
          <SimHUD items={hudItems} />
          {tip && (
            <div
              className="pointer-events-none absolute z-20 max-w-[240px] rounded-lg border border-cyan-400/40 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
              style={{ left: Math.min(tip.x + 12, 240), top: tip.y + 12 }}
            >
              <div className="font-semibold text-cyan-300">{tip.label}</div>
              {tip.detail && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{tip.detail}</div>}
            </div>
          )}
        </div>
      {failed && (
        <button onClick={retryScene} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110 transition">
          <RotateCcw className="w-4 h-4" /> Reintentar inicialización 3D
        </button>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setMode((m) => MODES[(MODES.findIndex((x) => x.id === m) + 1) % MODES.length].id)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-border/70 bg-secondary/60 hover:bg-secondary transition-colors text-cyan-300"
        >
          <Palette className="w-3.5 h-3.5" /> Color: {modeLabel}
        </button>
        {p.loadType === 'puntual' && (
          <>
            <span className="text-xs text-muted-foreground">Punto de aplicación:</span>
            <Pills
              options={[
                { id: '2', label: 'Nodo 3 (inferior)' },
                { id: '3', label: 'Nodo 4 (superior)' },
                { id: '4', label: 'Nodo 5 (inferior)' },
              ]}
              value={String(p.loadNode)}
              onChange={(v) => setP((s) => ({ ...s, loadNode: Number(v) }))}
            />
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Tipo de carga:</span>
        <Pills
          options={[
            { id: 'puntual', label: 'Puntual' },
            { id: 'distribuida', label: 'Distribuida (nodos 2–6)' },
          ]}
          value={p.loadType}
          onChange={(v) => setP((s) => ({ ...s, loadType: v }))}
        />
        <span className="text-xs text-muted-foreground">Deformación exagerada:</span>
        <Pills
          options={[
            { id: '1', label: '1×' },
            { id: '10', label: '10×' },
            { id: '50', label: '50×' },
          ]}
          value={String(exag)}
          onChange={(v) => setExag(Number(v))}
        />
      </div>
      <SimReadout
        items={[
          { label: 'Carga aplicada', value: fmt(tele?.loadKilo, 0), unit: 'kN', color: 'text-amber-300' },
          { label: 'Esfuerzo máximo', value: fmt(tele?.maxStress, 1), unit: 'MPa', color: over ? 'text-rose-300' : 'text-foreground' },
          { label: 'Reacción izq.', value: fmt(tele?.R0y, 2), unit: 'kN', color: 'text-emerald-300' },
          { label: 'Reacción der.', value: fmt(tele?.R6y, 2), unit: 'kN', color: 'text-emerald-300' },
          { label: 'Deformación máx.', value: fmt(tele?.maxDispMm, 3), unit: 'mm', color: 'text-violet-300' },
          { label: 'Escala visual', value: `${exag}×`, unit: '', color: 'text-muted-foreground' },
        ]}
      />
      {over && (
        <FailureBanner
          title="Esfuerzo por encima del límite elástico de diseño"
          detail={`σ_max = ${tele.maxStress.toFixed(1)} MPa > 150 MPa admisible. Alguna barra trabaja fuera del rango elástico: incrementa la sección, redistribuye la carga o reduce la magnitud.`}
          context={`Simulador armadura 3D: carga=${p.loadKilo} kN de tipo ${p.loadType}, esfuerzo máximo=${tele.maxStress.toFixed(1)} MPa, límite=150 MPa, deformación visual ×${exag}`}
        />
      )}
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 pt-1">
        <ParamSlider label="Magnitud total de la carga" value={p.loadKilo} unit="kN" min={1} max={150} step={1} onChange={(v) => setP((s) => ({ ...s, loadKilo: v }))} />
      </div>
    </SimShell>
  );
}