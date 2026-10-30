import { X, Palette, Sun, Moon, Sparkles } from 'lucide-react';
import { PRESETS, VECTOR_COLORS, useTheme } from '@/lib/ThemeContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export default function StylePanel({ open, onClose }) {
  const { prefs, update } = useTheme();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-6">
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default" />
      <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl border border-dorado-700/40 bg-card shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="flex items-center gap-2 font-heading font-semibold">
            <Palette className="w-4 h-4 text-dorado-400" /> MI ESTILO ITS
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tema institucional · ITS</p>
            <div className="grid gap-2.5">
              {PRESETS.map((preset) => {
                const active = prefs.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => update({ preset: preset.id })}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? 'border-dorado-500 bg-dorado-500/10 ring-1 ring-dorado-500'
                        : 'border-border hover:border-dorado-700/60 hover:bg-secondary/60'
                    }`}
                  >
                    <span className="flex gap-1 shrink-0">
                      {preset.swatch.map((c) => (
                        <span key={c} className="w-5 h-5 rounded-full border border-black/20" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{preset.label}</span>
                      <span className="block text-xs text-muted-foreground truncate">{preset.desc}</span>
                    </span>
                    {active && <Sparkles className="w-4 h-4 text-dorado-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-5 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajuste manual</p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Porcentaje de contraste</span>
                <span className="text-xs font-mono text-dorado-300">{prefs.contrast}%</span>
              </div>
              <Slider
                value={[prefs.contrast]}
                min={80}
                max={130}
                step={5}
                onValueChange={([v]) => update({ contrast: v })}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">100% cumple AAA. Sube o baja la intensidad del texto.</p>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-dorado-300" /> Modo oscuro automático
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Activa el tema nocturno de 20:00 a 07:00 (hora local).</p>
              </div>
              <Switch checked={prefs.autoDark} onCheckedChange={(v) => update({ autoDark: v })} />
            </div>

            <div>
              <span className="text-sm font-medium flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-dorado-300" /> Color de vectores 3D
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 mb-2">Vector A, paralelogramo y planos derivados en las simulaciones.</p>
              <div className="flex flex-wrap gap-2">
                {VECTOR_COLORS.map((c) => {
                  const active = prefs.vectorColor === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => update({ vectorColor: c.id })}
                      title={c.label}
                      className={`w-9 h-9 rounded-lg border-2 grid place-items-center transition-transform hover:scale-105 ${
                        active ? 'border-dorado-400 ring-1 ring-dorado-400' : 'border-border'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}