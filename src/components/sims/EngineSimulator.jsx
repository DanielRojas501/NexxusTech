import { useEffect, useRef, useState } from 'react';
import { Eye, Layers, RotateCcw } from 'lucide-react';
import SimShell from './SimShell';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import { createEngineScene } from './engineScene';
import useWebglScene from './useWebglScene';
import SceneCanvas from '@/components/sims/SceneCanvas';
import SimHUD from './SimHUD';
import PlaybackBar from './PlaybackBar';
import PistonGraphs from './PistonGraphs';
import FailureBanner from './FailureBanner';
import { setSimSnapshot } from '@/lib/simState';

const CTRL =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-border/70 bg-secondary/60 hover:bg-secondary transition-colors';

export default function EngineSimulator() {
  const mountRef = useRef(null);
  const [p, setP] = useState({ rpm: 300, stroke_mm: 90, rod_mm: 160, pressure_bar: 6, speed: 1 });
  const [view, setView] = useState({ playing: true, xray: false, exploded: false, dir: 1 });
  const [tele, setTele] = useState(null);
  const [tip, setTip] = useState(null);
  const { sceneRef, failed, revision, retryScene } = useWebglScene({
    create: createEngineScene,
    mountRef,
    onTelemetry: setTele,
    onHover: setTip,
  });

  useEffect(() => {
    sceneRef.current?.setState(p);
  }, [p, revision]);
  useEffect(() => {
    sceneRef.current?.setView(view);
  }, [view, revision]);

  const set = (k) => (v) => setP((s) => ({ ...s, [k]: v }));
  const fmt = (v, d = 2) => (tele && Number.isFinite(v) ? v.toFixed(d) : '—');

  useEffect(() => {
    setSimSnapshot(
      'engine',
      `Simulador motor 3D: RPM=${p.rpm}, presión=${p.pressure_bar} bar, carrera=${p.stroke_mm} mm, biela=${p.rod_mm} mm, potencia=${tele ? tele.power_kW.toFixed(2) : '—'} kW${tele?.overload ? ' (SOBRECARGA ACTIVA)' : ''}`
    );
  }, [p, tele]);

  const hudItems = tele
    ? [
        { label: 'Vel. angular', value: fmt(tele.rpmEff, 0), unit: 'RPM', color: 'text-dorado-300' },
        { label: 'Torque', value: fmt(tele.torque, 1), unit: 'N·m', color: 'text-guindo-300' },
        { label: 'Potencia', value: fmt(tele.power_kW, 2), unit: 'kW', color: 'text-verde-300' },
        { label: 'Vel. pistón', value: fmt(tele.vel, 2), unit: 'm/s', color: 'text-foreground' },
        { label: 'Esfuerzo biela', value: fmt(tele.fRod / 500, 0), unit: 'MPa', color: 'text-guindo-400' },
        { label: 'Fase cigüeñal', value: fmt(tele.phase * 360, 0), unit: '°', color: 'text-dorado-300' },
      ]
    : [];

  return (
    <SimShell
      title="Motor 4 tiempos · Biela-Manivela-Pistón 3D"
      subtitle="Arrastra para orbitar · toca una pieza para ver su valor físico · sliders en tiempo real"
    >

          <div
            ref={mountRef}
            className="relative h-[360px] sm:h-[440px] rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden touch-none"
          >
            <SceneCanvas label="Motor 3D interactivo" />
            {tip && (
              <div
                className="pointer-events-none absolute z-20 max-w-[250px] rounded-lg border border-cyan-400/40 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
                style={{ left: Math.min(tip.x + 12, 240), top: tip.y + 12 }}
              >
                <div className="font-semibold text-cyan-300">{tip.label}</div>
                {tip.detail && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{tip.detail}</div>}
              </div>
            )}
            <SimHUD items={hudItems} />
          </div>
          <PlaybackBar
            playing={view.playing}
            reverse={view.dir === -1}
            phase={tele?.phase}
            onToggle={() => setView((v) => ({ ...v, playing: !v.playing }))}
            onStep={() => sceneRef.current?.step()}
            onReverse={() => setView((v) => ({ ...v, dir: v.dir === 1 ? -1 : 1 }))}
            onScrub={(t) => sceneRef.current?.setPhase(t)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`${CTRL} ${view.xray ? 'text-cyan-300 border-cyan-400/50' : ''}`}
              onClick={() => setView((v) => ({ ...v, xray: !v.xray }))}
            >
              <Eye className="w-3.5 h-3.5" /> Vista rayos X
            </button>
            <button
              className={`${CTRL} ${view.exploded ? 'text-violet-300 border-violet-400/50' : ''}`}
              onClick={() => setView((v) => ({ ...v, exploded: !v.exploded }))}
            >
              <Layers className="w-3.5 h-3.5" /> Despiece
            </button>
          </div>
          <SimReadout
            items={[
              { label: 'Velocidad angular', value: fmt(tele?.omega, 1), unit: 'rad/s', color: 'text-cyan-300' },
              { label: 'Posición pistón', value: fmt(tele?.y_mm, 0), unit: 'mm', color: 'text-foreground' },
              { label: 'Velocidad pistón', value: fmt(tele?.vel), unit: 'm/s', color: 'text-foreground' },
              { label: 'Aceleración', value: fmt(tele?.acc, 0), unit: 'm/s²', color: 'text-cyan-300' },
              { label: 'Fuerza de gas', value: fmt(tele?.fGas, 0), unit: 'N', color: 'text-emerald-300' },
              { label: 'Inercia pistón', value: fmt(tele?.fInertia, 0), unit: 'N', color: 'text-rose-300' },
              { label: 'Torque cigüeñal', value: fmt(tele?.torque), unit: 'N·m', color: 'text-violet-300' },
              { label: 'Frecuencia', value: fmt(p.rpm, 0), unit: 'RPM', color: 'text-muted-foreground' },
            ]}
          />
          <PistonGraphs
            r_m={p.stroke_mm / 2000}
            L_m={p.rod_mm / 1000}
            omega={((p.rpm * 2 * Math.PI) / 60) * (view.dir ?? 1)}
            phase={tele?.phase}
          />
          {tele?.overload && (
            <FailureBanner
              title="Sobrecarga mecánica en el tren biela-pistón"
              detail={`Presión de ${p.pressure_bar} bar a ${p.rpm} RPM: la fuerza de gas (${fmt(tele.fGas, 0)} N) combinada con la inercia del pistón eleva el esfuerzo en la biela a ${fmt(tele.fRod / 500, 0)} MPa, arriba del admisible.`}
              context={`Simulador motor 3D: RPM=${p.rpm}, presión=${p.pressure_bar} bar, fuerza en biela=${tele.fRod.toFixed(0)} N, esfuerzo=${(tele.fRod / 500).toFixed(0)} MPa, carrera=${p.stroke_mm} mm, biela=${p.rod_mm} mm`}
            />
          )}
      {failed && (
        <button onClick={retryScene} className={CTRL}>
          <RotateCcw className="w-4 h-4" /> Reintentar inicialización 3D
        </button>
      )}
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 pt-1">
        <ParamSlider label="Velocidad angular (RPM)" value={p.rpm} unit="rpm" min={0} max={3000} step={25} onChange={set('rpm')} />
        <ParamSlider label="Velocidad de simulación" value={p.speed} unit="×" min={0.25} max={2} step={0.25} onChange={set('speed')} />
        <ParamSlider label="Carrera del pistón" value={p.stroke_mm} unit="mm" min={40} max={140} step={5} onChange={set('stroke_mm')} />
        <ParamSlider label="Longitud de biela" value={p.rod_mm} unit="mm" min={100} max={220} step={5} onChange={set('rod_mm')} />
        <ParamSlider label="Fuerza de combustión (presión de gas)" value={p.pressure_bar} unit="bar" min={1} max={30} step={0.5} onChange={set('pressure_bar')} />
      </div>
    </SimShell>
  );
}