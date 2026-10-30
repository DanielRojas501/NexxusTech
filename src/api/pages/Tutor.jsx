import { Bot } from 'lucide-react';
import ProfeBot from '@/components/tutor/ProfeBot';

const IDEAS = [
  'No entiendo cómo despejar x de la ecuación de mi tarea',
  '¿Cómo sé si una integral es por partes o por sustitución?',
  'No me da el resultado del diagrama de cuerpo libre',
];

export default function Tutor() {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5" /> Tutoría socrática
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-2">No entendí una tarea</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Abre Profe Bot y cuéntale tu duda: no te dará la respuesta, te hará las preguntas correctas para que la resuelvas tú. Puedes llegar aquí desde cualquier materia.
        </p>
      </div>
      <div className="panel p-6 space-y-3">
        <div className="text-sm font-medium">Para empezar, prueba con algo como:</div>
        <ul className="space-y-2">
          {IDEAS.map((t) => (
            <li key={t} className="rounded-lg bg-slate-950/50 border border-border/50 px-3 py-2 text-sm text-slate-300">
              “{t}”
            </li>
          ))}
        </ul>
      </div>
      <ProfeBot defaultOpen context="Sesión libre de tutoría: el alumno llega con una duda de tarea desde cualquier materia de tronco común de ingeniería." />
    </div>
  );
}