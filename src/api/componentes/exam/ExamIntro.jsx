import { useState } from 'react';
import { Timer, Calculator, BookMarked, ChartPie, Play } from 'lucide-react';
import Pills from '@/components/sims/Pills';

const FEATURES = [
  { icon: Timer, text: 'Cuenta regresiva real; se entrega sola al terminar el tiempo' },
  { icon: Calculator, text: 'Calculadora científica flotante y arrastrable' },
  { icon: BookMarked, text: 'Formulario desplegable de tronco común' },
  { icon: ChartPie, text: 'Desglose de desempeño por área al finalizar' },
];

export default function ExamIntro({ onStart }) {
  const [minutes, setMinutes] = useState('25');
  const [count, setCount] = useState('8');
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <span className="text-xs uppercase tracking-widest text-primary">Modo examen</span>
        <h1 className="text-3xl sm:text-5xl font-bold mt-3">Simulador de examen parcial</h1>
        <p className="text-muted-foreground mt-3">Reactivos con valores aleatorios en cada intento: nunca verás el mismo examen dos veces.</p>
      </div>
      <div className="panel p-6 sm:p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2"><div className="text-xs text-muted-foreground">Duración</div><Pills options={['15', '25', '40'].map((m) => ({ id: m, label: `${m} min` }))} value={minutes} onChange={setMinutes} /></div>
          <div className="space-y-2"><div className="text-xs text-muted-foreground">Reactivos</div><Pills options={['6', '8', '10'].map((m) => ({ id: m, label: m }))} value={count} onChange={setCount} /></div>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => <li key={f.text} className="flex gap-3 text-sm text-muted-foreground"><f.icon className="w-4 h-4 shrink-0 text-primary mt-0.5" />{f.text}</li>)}
        </ul>
        <button onClick={() => onStart(Number(minutes), Number(count))} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-guindo-600 to-dorado-500 text-guindo-50 dark:text-guindo-950 font-semibold hover:brightness-110 transition">
          <Play className="w-4 h-4" /> Comenzar examen
        </button>
      </div>
    </div>
  );
}