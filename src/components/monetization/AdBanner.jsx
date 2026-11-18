import { Crown, Megaphone } from 'lucide-react';

/**
 * Bloques publicitarios del plan Free (listos para AdSense o patrocinadores).
 * Los usuarios Premium no los ven (el contenedor decide si renderizarlos).
 */
export default function AdBanner({ variant = 'foot' }) {
  if (variant === 'side') {
    return (
      <aside className="panel p-4 flex flex-col sm:flex-row items-center gap-4 border-dashed border-dorado-500/40">
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-dorado-500/15 text-dorado-300 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
          <Megaphone className="w-3 h-3" /> Anuncio
        </span>
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-sm font-semibold">Espacio publicitario disponible</p>
          <p className="text-xs text-muted-foreground">Tu marca frente a miles de futuros ingenieros del ITS.</p>
        </div>
      </aside>
    );
  }
  return (
    <div className="panel p-5 text-center space-y-2 border-dashed border-dorado-500/40">
      <span className="inline-flex items-center gap-1 rounded-full bg-dorado-500/15 text-dorado-300 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide">
        <Megaphone className="w-3 h-3" /> Anuncio
      </span>
      <p className="text-sm font-semibold">Impulsa tu marca en VÉRTICE 3D</p>
      <p className="text-xs text-muted-foreground max-w-lg mx-auto">
        Bloque promocional del plan Free. <span className="inline-flex items-center gap-1 text-dorado-300"><Crown className="w-3 h-3" /> Los miembros Premium navegan sin anuncios.</span>
      </p>
    </div>
  );
}