import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Sistema de identidad visual "VÉRTICE 3D" — Instituto Tecnológico de Saltillo.
 * Presets: clasico (claro), nocturno (oscuro), premium (oscuro dorado).
 * Ajustes manuales: contraste, modo oscuro automático (20:00–07:00) y
 * color de los vectores en las simulaciones 3D.
 */

const KEY = 'vertice-its-prefs';

export const DEFAULT_PREFS = { preset: 'nocturno', contrast: 100, autoDark: false, vectorColor: 'dorado' };

export const PRESETS = [
  { id: 'clasico', label: 'Clásico Tec Saltillo', desc: 'Guindo dominante + blanco + detalles dorados', swatch: ['#7A1B29', '#FFFFFF', '#C5A059'] },
  { id: 'nocturno', label: 'Ingeniería Nocturna', desc: 'Negro-guindo + acentos dorados', swatch: ['#0D0B0E', '#C5A059', '#932435'] },
  { id: 'premium', label: 'Dorado Premium', desc: 'El dorado toma el rol principal', swatch: ['#14110A', '#D8B775', '#987836'] },
];

export const VECTOR_COLORS = [
  { id: 'dorado', label: 'Dorado Tec', hex: '#C5A059' },
  { id: 'guindo', label: 'Guindo Tec', hex: '#932435' },
  { id: 'blanco', label: 'Blanco', hex: '#F8FAFC' },
  { id: 'verde', label: 'Verde Técnico', hex: '#6FA37C' },
  { id: 'acero', label: 'Acero', hex: '#7C93AC' },
];

function readPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => {
  const A = hex2rgb(a), B = hex2rgb(b);
  return A.map((v, i) => Math.round(v + (B[i] - v) * t));
};
const rgbToHsl = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const isNight = () => {
  const h = new Date().getHours();
  return h >= 20 || h < 7;
};

/** Aplica el tema sobre <html>: clases dark/theme-premium, contraste y vector 3D. */
export function applyTheme(prefs) {
  const root = document.documentElement;
  const dark = prefs.preset !== 'clasico' || (prefs.autoDark && isNight());
  root.classList.toggle('dark', dark);
  root.classList.toggle('theme-premium', prefs.preset === 'premium');
  const vector = VECTOR_COLORS.find((v) => v.id === prefs.vectorColor) || VECTOR_COLORS[0];
  root.style.setProperty('--sim-vector', vector.hex);

  // Contraste manual: ajusta texto principal y secundario (AAA por defecto)
  const t = clamp01(Math.abs(prefs.contrast - 100) / 50) * (prefs.contrast >= 100 ? 1 : -1);
  const light = !dark;
  let fg = light ? '#0F172A' : '#F8FAFC';
  let muted = light ? '#475569' : '#CBD5E1';
  if (t !== 0) {
    if (light) {
      fg = t > 0 ? mix(fg, '#000000', t * 0.5) : mix(fg, '#475569', -t);
      muted = t > 0 ? mix(muted, '#334155', t) : mix(muted, '#64748B', -t);
    } else {
      fg = t > 0 ? mix(fg, '#FFFFFF', t * 0.5) : mix(fg, '#AEBCCB', -t);
      muted = t > 0 ? mix(muted, '#F1F5F9', t) : mix(muted, '#94A3B8', -t);
    }
  }
  root.style.setProperty('--foreground', rgbToHsl(hex2rgb(fg)));
  root.style.setProperty('--muted-foreground', rgbToHsl(hex2rgb(muted)));
}

// Aplica el tema guardado inmediatamente (antes del primer render, sin destello)
const initialPrefs = readPrefs();
applyTheme(initialPrefs);

const ThemeCtx = createContext(null);

export function ThemeProvider({ children }) {
  const [prefs, setPrefs] = useState(initialPrefs);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    applyTheme(prefs);
    if (!prefs.autoDark) return undefined;
    const id = setInterval(() => applyTheme({ ...prefs }), 60000);
    return () => clearInterval(id);
  }, [prefs]);

  const update = (patch) => setPrefs((p) => ({ ...p, ...patch }));
  const vectorHex = (VECTOR_COLORS.find((v) => v.id === prefs.vectorColor) || VECTOR_COLORS[0]).hex;

  return (
    <ThemeCtx.Provider value={{ prefs, update, vectorHex, isDark: prefs.preset !== 'clasico' || (prefs.autoDark && isNight()) }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}