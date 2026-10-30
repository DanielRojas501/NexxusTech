import { useState } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/apiClient';
import { getSimContextSummary } from '@/lib/simState';

export default function ProfeBot({ context = '', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const question = q.trim();
    if (!question || busy) return;
    setQ('');
    setBusy(true);
    const history = msgs.slice(-6).map((m) => `${m.role === 'user' ? 'Alumno' : 'Profe Bot'}: ${m.text}`);
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    try {
      const simCtx = getSimContextSummary();
      const fullCtx = [context, simCtx && `SIMULACIONES ACTIVAS (valores actuales de los sliders): ${simCtx}`].filter(Boolean).join(' · ');
      const res = await api.functions.invoke('profeBot', { question, context: fullCtx, history });
      setMsgs((m) => [...m, { role: 'bot', text: res.reply || 'Intenta de nuevo en un momento.' }]);
    } catch {
      setMsgs((m) => [...m, { role: 'bot', text: 'Hubo un problema de conexión. Inténtalo otra vez.' }]);
    }
    setBusy(false);
  };

  return (
    <>
      <motion.button onClick={() => setOpen((v) => !v)} whileTap={{ scale: 0.92 }}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-guindo-600 to-dorado-500 text-guindo-50 dark:text-guindo-950 pl-3 pr-4 py-2.5 font-medium text-sm shadow-lg shadow-dorado-500/25">
        <Bot className="w-5 h-5" /> Profe Bot
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div drag dragMomentum={false} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="fixed bottom-20 left-4 z-50 w-[min(92vw,340px)] rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 cursor-grab active:cursor-grabbing">
              <span className="flex items-center gap-2 text-sm font-medium"><Bot className="w-4 h-4 text-primary" /> Profe Bot · tutor socrático</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="h-[300px] overflow-y-auto p-4 space-y-3" onPointerDownCapture={(e) => e.stopPropagation()}>
              {msgs.length === 0 && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pregúntame lo que quieras del ejercicio. No te daré la respuesta: te haré las preguntas correctas para que la encuentres tú.
                </p>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                  {m.text}
                </div>
              ))}
              {busy && <div className="flex gap-1 px-2"><span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" /><span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" /><span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" /></div>}
            </div>
            <div className="flex gap-2 p-3 border-t border-border/60" onPointerDownCapture={(e) => e.stopPropagation()}>
              <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="¿No sabes por dónde empezar?" disabled={busy}
                className="flex-1 rounded-lg bg-slate-950/70 border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50" />
              <button onClick={send} disabled={busy} className="p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}