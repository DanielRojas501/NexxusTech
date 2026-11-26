import React from "react";
import { Sparkles } from "lucide-react";
import { SUBJECTS } from "@/data/subjects";

// Engrane recto de 18 dientes, como en una lámina de Dibujo Técnico.
const TEETH = 18;
const R_TIP = 100;
const R_ROOT = 86;
const gearPath = (() => {
  const step = (2 * Math.PI) / TEETH;
  const pt = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  let d = "";
  for (let i = 0; i < TEETH; i++) {
    const a = i * step;
    d += `${i ? "L" : "M"}${pt(R_ROOT, a)} L${pt(R_TIP, a + step * 0.12)} L${pt(R_TIP, a + step * 0.38)} L${pt(R_ROOT, a + step * 0.5)} `;
    d += `A${R_ROOT} ${R_ROOT} 0 0 1 ${pt(R_ROOT, a + step)} `;
  }
  return d + "Z";
})();

function GearDrawing() {
  return (
    <svg viewBox="-170 -150 340 330" className="h-full max-h-[400px] w-auto max-w-full text-dorado-500" aria-hidden="true">
      <style>{`
        .trazo { stroke-dasharray: 1; stroke-dashoffset: 1; animation: trazar 1.8s cubic-bezier(.6,.1,.3,1) forwards; }
        .trazo-2 { animation-delay: .9s; }
        .eje { opacity: 0; animation: aparecer .6s ease 1.6s forwards; }
        @keyframes trazar { to { stroke-dashoffset: 0; } }
        @keyframes aparecer { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .trazo, .eje { animation: none; stroke-dashoffset: 0; opacity: 1; }
        }
      `}</style>
      <defs>
        <marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1 L10 5 L0 9 z" fill="currentColor" />
        </marker>
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        {/* Ejes de simetría (línea de centros: trazo-punto) */}
        <g className="eje" strokeWidth="0.8" strokeDasharray="14 4 2 4" opacity="0.7">
          <line x1="-135" y1="0" x2="135" y2="0" />
          <line x1="0" y1="-135" x2="0" y2="135" />
          <circle r="93" />
        </g>
        <path d={gearPath} pathLength="1" className="trazo" />
        <circle r="34" pathLength="1" className="trazo trazo-2" />
        <path d="M-7 -34 V-44 H7 V-34" pathLength="1" className="trazo trazo-2" />
        {/* Cota del diámetro exterior */}
        <g className="eje" strokeWidth="0.9">
          <line x1="-100" y1="8" x2="-100" y2="150" />
          <line x1="100" y1="8" x2="100" y2="150" />
          <line x1="-98" y1="140" x2="98" y2="140" markerStart="url(#flecha)" markerEnd="url(#flecha)" />
          <path d="M24 -24 L70 -112 H118" />
        </g>
      </g>
      <g className="eje font-mono" fill="currentColor" fontSize="12">
        <text x="0" y="132" textAnchor="middle">Ø 200</text>
        <text x="74" y="-117">Ø 68</text>
        <text x="-150" y="-128">z = 18</text>
      </g>
    </svg>
  );
}

function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-guinda-900 to-dorado-500 grid place-items-center ring-1 ring-dorado-500/40">
        <Sparkles className="w-4 h-4 text-dorado-200" aria-hidden="true" />
      </div>
      <span className="font-heading font-bold text-lg tracking-tight">ApoyandoTec</span>
    </div>
  );
}

// Cajetín (cuadro de referencia) de la lámina: datos reales, no decoración.
function TitleBlock({ sheet }) {
  const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  const cell = "border-dorado-500/35 px-3 py-2";
  const label = "block font-mono text-[10px] text-dorado-300/80";
  return (
    <div className="grid grid-cols-4 border border-dorado-500/35 text-sm text-guinda-50">
      <div className={`${cell} col-span-2 border-r border-b`}><span className={label}>Proyecto</span>ApoyandoTec</div>
      <div className={`${cell} col-span-2 border-b`}><span className={label}>Hoja</span>{sheet}</div>
      <div className={`${cell} col-span-2 border-r`}><span className={label}>Para</span>Estudiantes del Tec de Saltillo</div>
      <div className={`${cell} border-r`}><span className={label}>Materias</span>{SUBJECTS.length}</div>
      <div className={cell}><span className={label}>Fecha</span>{today}</div>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside
        className="relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col gap-6 overflow-hidden bg-guinda-900 text-guinda-50 p-10 xl:p-14"
        style={{
          backgroundImage:
            "linear-gradient(rgba(197,160,89,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(197,160,89,.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Logo />
        {/* El dibujo cede espacio: en pantallas bajas se encoge y el cajetín siempre queda visible. */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <GearDrawing />
        </div>
        <div className="space-y-5 max-w-lg">
          <div>
            <h2 className="font-heading text-4xl 2xl:text-5xl font-bold leading-[1.05] tracking-tight">
              Tronco común,
              <br />
              sin brechas.
            </h2>
            <p className="mt-4 text-guinda-100 leading-relaxed">
              Teoría, simuladores y exámenes de práctica para las materias de los primeros semestres de ingeniería.
            </p>
          </div>
          <TitleBlock sheet={title} />
          <p className="text-xs text-guinda-200/80">Proyecto estudiantil independiente; no es un sitio oficial del TecNM.</p>
        </div>
      </aside>

      <main className="min-h-screen flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
        <div className="lg:hidden">
          <Logo />
          <p className="mt-1 text-sm text-muted-foreground">Para estudiantes del Tec de Saltillo</p>
        </div>
        <div className="flex-1 flex items-center py-10">
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground leading-relaxed">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-8 text-sm text-muted-foreground">{footer}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
