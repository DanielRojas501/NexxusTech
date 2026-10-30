import { BookOpen, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import MathText from '@/components/ui/MathText';
import { Button } from '@/components/ui/button';
import { THEORY } from '@/data/simTheory';

const stripTex = (s) => s.replace(/\$\$?/g, '');

export default function TheoryPanel({ theoryKey }) {
  const t = THEORY[theoryKey];
  if (!t) return null;

  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text(`Ficha teórica — ${t.title}`, 14, y, { maxWidth: 180 });
    y += 10;
    doc.setFontSize(10);
    const line = (txt, indent = 0) => {
      const rows = doc.splitTextToSize(txt, 180 - indent);
      rows.forEach((r) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(r, 14 + indent, y);
        y += 5;
      });
      y += 2;
    };
    doc.setFont(undefined, 'bold');
    line('Introducción');
    doc.setFont(undefined, 'normal');
    line(stripTex(t.intro));
    doc.setFont(undefined, 'bold');
    line('Ecuaciones gobernantes');
    doc.setFont(undefined, 'normal');
    t.laws.forEach((l) => {
      line(`${l.name}:  ${l.tex}`);
    });
    doc.setFont(undefined, 'bold');
    line('Variables de estado');
    doc.setFont(undefined, 'normal');
    t.vars.forEach((v) => line(`${stripTex(v.sym)}: ${stripTex(v.desc)}`));
    doc.setFont(undefined, 'bold');
    line('Notas clave');
    doc.setFont(undefined, 'normal');
    t.notes.forEach((n) => line(`• ${stripTex(n)}`));
    doc.save(`ficha-teorica-${theoryKey}.pdf`);
  };

  return (
    <aside className="panel p-4 sm:p-5 space-y-5 xl:sticky xl:top-20 xl:max-h-[calc(100vh-9rem)] xl:overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary">
            <BookOpen className="w-3.5 h-3.5" /> Panel teórico
          </span>
          <h3 className="font-heading font-semibold text-sm mt-1.5 leading-snug">{t.title}</h3>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0 text-xs" onClick={exportPdf}>
          <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
        </Button>
      </div>

      <MathText className="block text-[13px] text-muted-foreground leading-relaxed">{t.intro}</MathText>

      <div className="space-y-2.5">
        <h4 className="text-[11px] uppercase tracking-widest text-cyan-300 font-medium">Ecuaciones gobernantes</h4>
        {t.laws.map((l) => (
          <div key={l.name} className="rounded-xl bg-slate-950/60 border border-border/50 p-3">
            <div className="text-[11px] text-muted-foreground">{l.name}</div>
            <MathText className="block mt-1 text-foreground text-sm">{`$$${l.tex}$$`}</MathText>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-[11px] uppercase tracking-widest text-violet-300 font-medium">Variables de estado</h4>
        <div className="rounded-xl border border-border/50 divide-y divide-border/40">
          {t.vars.map((v) => (
            <div key={v.sym} className="px-3 py-2 flex gap-3 items-baseline text-xs">
              <MathText className="font-mono text-primary shrink-0 min-w-14">{`$${v.sym}$`}</MathText>
              <MathText className="text-muted-foreground">{v.desc}</MathText>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-[11px] uppercase tracking-widest text-emerald-300 font-medium">Leyes y observaciones</h4>
        <ul className="space-y-1.5">
          {t.notes.map((n, i) => (
            <li key={i} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
              <span className="text-emerald-400 shrink-0">▸</span>
              <MathText>{n}</MathText>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}