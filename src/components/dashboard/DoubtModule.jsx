import { Link } from 'react-router-dom';
import { Timer, HelpCircle, Box, BookMarked, ArrowRight } from 'lucide-react';

const COLORS = {
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  violet: 'bg-violet-400/10 text-violet-300 ring-violet-400/30',
  cyan: 'bg-cyan-400/10 text-cyan-300 ring-cyan-400/30',
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
};

const ACTIONS = [
  { to: '/examen', icon: Timer, color: 'amber', title: 'Tengo examen mañana', desc: 'Entra al simulador cronometrado y practica reactivos por área.' },
  { to: '/tutor', icon: HelpCircle, color: 'violet', title: 'No entendí una tarea', desc: 'Profe Bot te guía con preguntas socráticas hasta que la resuelvas.' },
  { to: '/laboratorio', icon: Box, color: 'cyan', title: 'Quiero simular un componente 3D', desc: 'Motores, engranes, armaduras y más, en tiempo real.' },
  { to: '/formulario', icon: BookMarked, color: 'emerald', title: 'Necesito un formulario', desc: 'Índice libre de fórmulas por grupo, siempre a un clic.' },
];

export default function DoubtModule() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Llegué a resolver una duda</h2>
        <p className="text-sm text-muted-foreground mt-1">Acceso directo sin navegar por temarios: entra donde lo necesites.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="panel p-4 group hover:border-primary/50 transition-colors">
            <div className={`w-10 h-10 rounded-xl grid place-items-center ring-1 ${COLORS[a.color]}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <div className="mt-3 font-semibold text-sm leading-snug">{a.title}</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Entrar <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}