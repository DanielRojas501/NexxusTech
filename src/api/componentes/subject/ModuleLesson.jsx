import { jsPDF } from 'jspdf';
import { FileDown } from 'lucide-react';
import WorkedExample from './WorkedExample';
import ExerciseItem from './ExerciseItem';

const Label = ({ children }) => <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{children}</div>;

export default function ModuleLesson({ module, index, subjectName, onExerciseCorrect }) {
  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(15); doc.setTextColor(17, 24, 39);
    doc.text(module.title, 14, y);
    doc.setFontSize(10); doc.setTextColor(110);
    doc.text(`Apoyandote · ${subjectName}`, 14, y + 6);
    y += 16;
    const block = (label, text) => {
      doc.setFontSize(10); doc.setTextColor(6, 182, 212);
      const lines = doc.splitTextToSize(text, 182);
      if (y + lines.length * 5 + 10 > 285) { doc.addPage(); y = 20; }
      doc.text(label, 14, y); y += 6;
      doc.setTextColor(30);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 6;
    };
    block('TEORIA', module.theory);
    block('FORMULA CLAVE', module.formula);
    block('EJEMPLO RESUELTO', `${module.example.statement} Pasos: ${module.example.steps.join(' / ')}. Resultado: ${module.example.result}`);
    module.exercises.forEach((ex, i) => block(`EJERCICIO ${i + 1}`, ex.q));
    doc.save(`Apoyandote - ${module.title}.pdf`);
  };

  return (
    <article className="panel p-5 sm:p-7 space-y-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-primary">MÓDULO {String(index + 1).padStart(2, '0')}</span>
        <div className="h-px flex-1 bg-border/60" />
        <button onClick={exportPdf} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <FileDown className="w-3.5 h-3.5" /> Ficha PDF
        </button>
      </div>
      <h3 className="text-xl sm:text-2xl font-semibold">{module.title}</h3>
      <div>
        <Label>Teoría</Label>
        <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed">{module.theory}</p>
      </div>
      <div>
        <Label>Fórmula clave</Label>
        <div className="rounded-xl bg-gradient-to-r from-cyan-400/10 to-violet-400/10 border border-primary/20 px-4 py-3 font-mono text-sm sm:text-base text-cyan-100 overflow-x-auto">{module.formula}</div>
      </div>
      <div>
        <Label>Ejemplo resuelto paso a paso</Label>
        <WorkedExample example={module.example} />
      </div>
      <div>
        <Label>Banco de ejercicios</Label>
        <div className="grid md:grid-cols-2 gap-3">
          {module.exercises.map((ex, i) => <ExerciseItem key={i} ex={ex} n={i + 1} onCorrect={onExerciseCorrect ? () => onExerciseCorrect(index) : null} />)}
        </div>
      </div>
    </article>
  );
}