import { useEffect, useRef, useState } from 'react';
import { Cog, RotateCcw } from 'lucide-react';
import SimShell from './SimShell';
import ParamSlider from './ParamSlider';
import SimReadout from './SimReadout';
import { createGearScene } from './gearScene';
import useWebglScene from './useWebglScene';
import SceneCanvas from '@/components/sims/SceneCanvas';
import SimHUD from './SimHUD';
import PlaybackBar from './PlaybackBar';
import FailureBanner from './FailureBanner';
import { setSimSnapshot } from '@/lib/simState';

const CTRL =
  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-border/70 bg-secondary/60 hover:bg-secondary transition-colors';

export default function GearSimulator() {
  const mountRef = useRef(null);
  const [p, setP] = useState({ z1: 14, z2: 28, module: 3, rpm: 60, torque: 40, speed: 1, helix: 0 });
  const [view, setView] = useState({ playing: true, dir: 1 });
  const [tele, setTele] = useState(null);
  const [tip, setTip] = useState(null);
  const { sceneRef, failed, revision, retryScene } = useWebglScene({
    create: createGearScene,
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
      'gears',
      `Tren de engranes 3D: Z1=${p.z1}, Z2=${p.z2}, módulo=${p.module} mm, relación i=${(tele?.i ?? p.z2 / p.z1).toFixed(2)}, distancia entre centros=${(tele?.a_mm ?? ((p.module * (p.z1 + p.z2)) / 2)).toFixed(1)} mm, RPM salida=${tele ? tele.rpmOut.toFixed(1) : '—'}${tele?.interference ? ' (INTERFERENCIA DE DIENTES)' : ''}`
    );
  }, [p, tele]);

  const hudItems = tele
    ? [
        { label: 'Relación i', value: fmt(tele.i, 2), unit: '', color: 'text-dorado-300' },
        { label: 'Salida ω₂', value: fmt(tele.rpmOut, 1), unit: 'RPM', color: 'text-guindo-300' },
        { label: 'Potencia', value: fmt(tele.power_kW, 2), unit: 'kW', color: 'text-verde-300' },
        { label: 'Torque salida', value: fmt(tele.torqueOut, 1), unit: 'N·m', color: 'text-dorado-300' },
      ]
    : [];

  return (
    <SimShell
      title="Tren de engranes · Transmisión mecánica 3D"
      subtitle="Perfil de diente en evolvente real · recto o helicoidal · arrastra para orbitar · toca un engrane"
    >

          <div
            ref={mountRef}
            className="relative h-[360px] sm:h-[440px] rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden touch-none"
          >
            <SceneCanvas label="Engranes 3D interactivos" />
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 text-[11px] font-mono pointer-events-none">
              <span className="text-dorado-300">● Engrane 1 (entrada, Z₁={p.z1})</span>
              <span className="text-guindo-300">● Engrane 2 (salida, Z₂={p.z2})</span>
              <span className="text-dorado-200">● Zona de contacto / estrés</span>
            </div>
            <SimHUD items={hudItems} />
            {tip && (
              <div
                className="pointer-events-none absolute z-20 max-w-[250px] rounded-lg border border-cyan-400/40 bg-slate-900/95 px-3 py-2 text-xs shadow-xl"
                style={{ left: Math.min(tip.x + 12, 240), top: tip.y + 12 }}
              >
                <div className="font-semibold text-cyan-300">{tip.label}</div>
                {tip.detail && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{tip.detail}</div>}
              </div>
            )}
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
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Cog className="w-3.5 h-3.5" /> Sentidos de rotación opuestos, engrane perfecto en el paso primitivo
            </span>
          </div>
          <SimReadout
            items={[
              { label: 'Relación i = Z₂/Z₁', value: fmt(tele?.i), unit: '', color: 'text-cyan-300' },
              { label: 'Salida ω₂', value: fmt(tele?.rpmOut, 1), unit: 'RPM', color: 'text-violet-300' },
              { label: 'Torque salida', value: fmt(tele?.torqueOut, 1), unit: 'N·m', color: 'text-emerald-300' },
              { label: 'Fuerza en diente', value: fmt(tele?.contactForce, 0), unit: 'N', color: 'text-amber-300' },
              { label: 'Distancia entre centros', value: fmt(tele?.a_mm, 1), unit: 'mm', color: 'text-foreground' },
              { label: 'Potencia', value: fmt(tele?.power_kW, 2), unit: 'kW', color: 'text-emerald-300' },
            ]}
          />
          {tele?.interference && (
            <FailureBanner
              title="Interferencia de dientes (undercut)"
              detail={`Con ángulo de presión α = 20° y addendum estándar, el piñón necesita Z₁ ≥ 17 dientes para que el flanco del engrane conducido no invada la raíz del piñón. Actualmente Z₁ = ${p.z1}.`}
              context={`Simulador de engranes 3D: Z1=${p.z1}, Z2=${p.z2}, módulo=${p.module} mm, relación de transmisión i=${tele.i.toFixed(2)}, distancia entre centros=${tele.a_mm.toFixed(1)} mm, condición de interferencia activa`}
            />
          )}
      {failed && (
        <button onClick={retryScene} className={CTRL}>
          <RotateCcw className="w-4 h-4" /> Reintentar inicialización 3D
        </button>
      )}
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5 pt-1">
        <ParamSlider label="Dientes engrane 1 (Z₁)" value={p.z1} min={8} max={32} step={1} onChange={set('z1')} />
        <ParamSlider label="Dientes engrane 2 (Z₂)" value={p.z2} min={8} max={40} step={1} onChange={set('z2')} />
        <ParamSlider label="Módulo (m)" value={p.module} unit="mm" min={2} max={4} step={0.5} onChange={set('module')} />
        <ParamSlider label="Velocidad de entrada" value={p.rpm} unit="RPM" min={5} max={300} step={5} onChange={set('rpm')} />
        <ParamSlider label="Torque de entrada" value={p.torque} unit="N·m" min={5} max={200} step={5} onChange={set('torque')} />
        <ParamSlider label="Ángulo de hélice (0° = recto)" value={p.helix} unit="°" min={0} max={25} step={5} onChange={set('helix')} />
        <ParamSlider label="Velocidad de simulación" value={p.speed} unit="×" min={0.25} max={2} step={0.25} onChange={set('speed')} />
      </div>
    </SimShell>
  );
}