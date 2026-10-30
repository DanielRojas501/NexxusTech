import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero({ query, onQuery }) {
  return (
    <section className="relative pt-4 sm:pt-10 text-center max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Tronco común de ingeniería · Tec Saltillo · UCA
        </span>
        <h1 className="mt-6 text-4xl sm:text-6xl font-bold leading-[1.05]">
          De la prepa a la ingeniería,{' '}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">sin brechas.</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Aprende tocando la física y las matemáticas: simuladores en vivo, problemas que cambian contigo y exámenes realistas.
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative mt-8 group">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-400/40 to-violet-500/40 opacity-0 group-focus-within:opacity-100 blur transition-opacity" />
        <div className="relative flex items-center rounded-2xl bg-card border border-border">
          <Search className="w-5 h-5 text-muted-foreground ml-5" />
          <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Busca una materia o tema: derivadas, Simplex, gases ideales…"
            className="flex-1 bg-transparent px-4 py-4 text-sm sm:text-base placeholder:text-muted-foreground/70 focus:outline-none" />
          {query && <button onClick={() => onQuery('')} className="mr-4 p-1 rounded-md text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
        </div>
      </motion.div>
    </section>
  );
}