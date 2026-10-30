import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import SimShell from './SimShell';
import VectorStats from './VectorStats';
import VectorInputs from './VectorInputs';
import { createVectorScene, toThree } from './vectorScene';
import useWebglScene from './useWebglScene';
import SceneCanvas from '@/components/sims/SceneCanvas';
import { useTheme } from '@/lib/ThemeContext';

export default function VectorSpace3D() {
  const [A, setA] = useState([3, -2, 5]);
  const [B, setB] = useState([1, 4, -2]);
  const { vectorHex } = useTheme();
  const mountRef = useRef(null);
  const { sceneRef, failed, revision, retryScene } = useWebglScene({
    create: createVectorScene,
    mountRef,
    onTelemetry: (key, v) => (key === 'A' ? setA(v) : setB(v)),
  });

  useEffect(() => {
    sceneRef.current?.setCustomColor(vectorHex);
  }, [vectorHex, revision]);

  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const C = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
    const cl = Math.hypot(...C);
    const k = cl > 6 ? 6 / cl : 1;
    s.setArrow(s.arrowA, s.tipA, toThree(A));
    s.setArrow(s.arrowB, s.tipB, toThree(B));
    s.setArrow(s.arrowC, null, toThree(C.map((c) => c * k)));
    s.setParallelogram(toThree(A), toThree(B));
    s.setPlane(toThree(C));
  }, [A, B, revision]);

  return (
    <SimShell title="Espacio vectorial 3D" subtitle="Arrastra las esferas para mover las puntas · gira la cámara con el cursor">

      <div ref={mountRef} className="relative h-[360px] sm:h-[420px] rounded-xl bg-slate-950/70 border border-border/60 overflow-hidden touch-none">
        <SceneCanvas label="Espacio vectorial 3D interactivo" />
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 text-[11px] font-mono pointer-events-none">
          <span style={{ color: vectorHex }}>● A</span>
          <span className="text-acero-200">● B</span>
          <span className="text-guindo-400">● A × B (escalado)</span>
          <span className="text-guindo-300/70">▲ Paralelogramo A·B + plano generado (⊥ a A×B)</span>
          <span className="text-muted-foreground mt-1"><span className="text-guindo-400">X</span> · <span className="text-verde-400">Y</span> · <span className="text-acero-400">Z</span></span>
        </div>
      </div>
      {failed && (
        <button onClick={retryScene} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:brightness-110 transition">
          <RotateCcw className="w-4 h-4" /> Reintentar inicialización 3D
        </button>
      )}
      <VectorStats A={A} B={B} />
      <VectorInputs A={A} B={B} setA={setA} setB={setB} />
    </SimShell>
  );
}