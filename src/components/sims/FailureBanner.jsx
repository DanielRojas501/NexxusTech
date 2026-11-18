import { useState } from 'react';
import { AlertTriangle, Bot } from 'lucide-react';
import { askSimHint } from '@/lib/simState';

// Banner de condición de falla activada en la simulación.
// Ofrece una micro-pista teórica generada por el tutor socrático "Profe Bot".
export default function FailureBanner({ title, detail, context }) {
  const [hint, setHint] = useState(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    setBusy(true);
    try {
      setHint(
        await askSimHint(
          'Se activó una condición de falla en la simulación. Dame una micro-pista teórica (sin la solución) sobre el fenómeno físico-matemático detrás.',
          context
        )
      );
    } catch {
      setHint('No se pudo contactar al Profe Bot. Inténtalo otra vez.');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3.5 py-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-300 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-rose-200">{title}</div>
          <div className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">{detail}</div>
        </div>
      </div>
      <button
        onClick={ask}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-lg bg-secondary/80 border border-border/70 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 hover:bg-secondary disabled:opacity-50 transition-colors"
      >
        <Bot className="w-3.5 h-3.5" /> {busy ? 'Pensando…' : 'Micro-pista del Profe Bot'}
      </button>
      {hint && (
        <div className="rounded-lg bg-slate-950/70 border border-cyan-400/30 px-3 py-2 text-[11px] text-cyan-100 leading-relaxed">
          <span className="text-cyan-300 font-semibold">Profe Bot: </span>
          {hint}
        </div>
      )}
    </div>
  );
}