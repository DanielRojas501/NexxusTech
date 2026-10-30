const TWO_PI = 2 * Math.PI;
const near = (a, b) => Math.abs(a - b) <= Math.max(Math.abs(b) * 0.02, 0.02);
const sg = (b) => `${b >= 0 ? '+' : '−'} ${Math.abs(b)}`;
const w0 = (p) => (TWO_PI * p.rpm) / 60;

export const LIVE_PROBLEMS = [
  {
    id: 'helice', subject: 'fisica-dinamica', title: 'Hélice con aceleración angular', sim: 'rotation',
    params: [
      { key: 'rpm', label: 'Velocidad inicial', unit: 'RPM', min: 30, max: 600, step: 10, default: 180 },
      { key: 'radius', label: 'Radio del aspa', unit: 'm', min: 0.1, max: 1.5, step: 0.05, default: 0.5 },
      { key: 'alpha', label: 'Aceleración angular', unit: 'rad/s²', min: 0, max: 10, step: 0.5, default: 3 },
      { key: 't', label: 'Tiempo', unit: 's', min: 1, max: 10, step: 1, default: 4 },
    ],
    statement: (p) => `Una hélice de ${p.radius} m de radio gira a ${p.rpm} RPM y acelera a razón de ${p.alpha} rad/s². Determina la velocidad angular inicial, la velocidad tangencial y la aceleración centrípeta en la punta del aspa, y la velocidad angular después de ${p.t} s.`,
    steps: [
      { label: 'Velocidad angular inicial ω₀', formula: 'ω₀ = 2π · RPM / 60', unit: 'rad/s', compute: w0,
        hint: 'Convierte revoluciones por minuto a radianes por segundo: 1 rev = 2π rad y 1 min = 60 s.',
        diagnose: (u, p) => near(u, p.rpm) ? 'Usaste las RPM directamente. Debes convertir a rad/s multiplicando por 2π/60.'
          : near(u, p.rpm / 60) ? 'Eso son revoluciones por segundo. Falta multiplicar por 2π para obtener rad/s.'
          : near(u, p.rpm * TWO_PI) ? 'Multiplicaste por 2π pero olvidaste dividir entre 60 s.' : null },
      { label: 'Velocidad tangencial v', formula: 'v = ω₀ · r', unit: 'm/s', compute: (p) => w0(p) * p.radius,
        hint: 'La velocidad tangencial es ω (en rad/s) multiplicada por el radio.',
        diagnose: (u, p) => near(u, p.rpm * p.radius) ? 'Multiplicaste las RPM por el radio: primero convierte ω a rad/s.'
          : near(u, w0(p) / p.radius) ? 'Dividiste entre r; la relación correcta es v = ω·r.' : null },
      { label: 'Aceleración centrípeta a꜀', formula: 'a꜀ = ω₀² · r', unit: 'm/s²', compute: (p) => w0(p) ** 2 * p.radius,
        hint: 'a꜀ = ω²·r = v²/r y siempre apunta hacia el centro de giro.',
        diagnose: (u, p) => near(u, w0(p) * p.radius) ? 'Ese es el valor de v. Recuerda elevar ω al cuadrado: a꜀ = ω²·r.'
          : near(u, w0(p) ** 2) ? 'Calculaste ω², pero olvidaste multiplicar por el radio.'
          : near(u, w0(p) ** 2 / p.radius) ? 'a꜀ = ω²·r, no ω²/r.' : null },
      { label: 'Velocidad angular final ω(t)', formula: 'ω = ω₀ + α · t', unit: 'rad/s', compute: (p) => w0(p) + p.alpha * p.t,
        hint: 'Con aceleración angular constante, ω crece linealmente con el tiempo.',
        diagnose: (u, p) => near(u, p.alpha * p.t) ? 'Falta sumar la velocidad angular inicial ω₀.'
          : near(u, w0(p) + p.alpha) ? 'Multiplica α por el tiempo t antes de sumarlo.'
          : near(u, p.rpm + p.alpha * p.t) ? 'ω₀ debe estar en rad/s, no en RPM.' : null },
    ],
    simProps: (p, set) => ({ rpm: p.rpm, onRpmChange: (v) => set('rpm', v), rpmMin: 30, rpmMax: 600, radius: p.radius, alpha: p.alpha }),
  },
  {
    id: 'resorte', subject: 'ecuaciones-diferenciales', title: 'Oscilador masa-resorte', sim: 'oscillator',
    params: [
      { key: 'm', label: 'Masa', unit: 'kg', min: 0.5, max: 5, step: 0.5, default: 2 },
      { key: 'k', label: 'Constante del resorte', unit: 'N/m', min: 10, max: 200, step: 10, default: 50 },
      { key: 'A', label: 'Amplitud', unit: 'm', min: 0.05, max: 0.3, step: 0.05, default: 0.2 },
    ],
    statement: (p) => `Un bloque de ${p.m} kg está unido a un resorte de k = ${p.k} N/m y se suelta desde ${p.A} m de su posición de equilibrio (sin fricción). Resuelve m·x″ + k·x = 0 y encuentra ω₀, el periodo, la frecuencia y la velocidad máxima.`,
    steps: [
      { label: 'Frecuencia angular natural ω₀', formula: 'ω₀ = √(k/m)', unit: 'rad/s', compute: (p) => Math.sqrt(p.k / p.m),
        hint: 'De la ecuación característica mr² + k = 0 se obtiene r = ±iω₀ con ω₀ = √(k/m).',
        diagnose: (u, p) => near(u, p.k / p.m) ? 'Calculaste k/m pero olvidaste la raíz cuadrada.'
          : near(u, Math.sqrt(p.m / p.k)) ? 'Invertiste el cociente: es √(k/m), no √(m/k).' : null },
      { label: 'Periodo T', formula: 'T = 2π/ω₀', unit: 's', compute: (p) => TWO_PI / Math.sqrt(p.k / p.m),
        hint: 'Un ciclo completo corresponde a 2π radianes.',
        diagnose: (u, p) => { const w = Math.sqrt(p.k / p.m); return near(u, 1 / w) ? 'Falta el factor 2π: T = 2π/ω₀.' : near(u, TWO_PI * w) ? 'T = 2π/ω₀, no 2π·ω₀.' : near(u, w / TWO_PI) ? 'Eso es la frecuencia f. El periodo es su inverso.' : null; } },
      { label: 'Frecuencia f', formula: 'f = 1/T', unit: 'Hz', compute: (p) => Math.sqrt(p.k / p.m) / TWO_PI,
        hint: 'La frecuencia es el número de ciclos por segundo, el inverso del periodo.',
        diagnose: (u, p) => { const w = Math.sqrt(p.k / p.m); return near(u, w) ? 'ω₀ es la frecuencia angular (rad/s). f = ω₀/2π.' : near(u, TWO_PI / w) ? 'Ese es el periodo. f = 1/T.' : null; } },
      { label: 'Velocidad máxima vₘₐₓ', formula: 'vₘₐₓ = A · ω₀', unit: 'm/s', compute: (p) => p.A * Math.sqrt(p.k / p.m),
        hint: 'x(t) = A·cos(ω₀t) → v(t) = −Aω₀·sin(ω₀t); su máximo es Aω₀.',
        diagnose: (u, p) => { const w = Math.sqrt(p.k / p.m); return near(u, p.A * w * w) ? 'Eso es la aceleración máxima (Aω₀²). La velocidad máxima es Aω₀.' : near(u, p.A / w) ? 'Multiplica la amplitud por ω₀, no dividas.' : null; } },
    ],
    simProps: (p) => ({ mass: p.m, k: p.k, amplitude: p.A, lockMode: 'resorte' }),
  },
  {
    id: 'tangente', subject: 'calculo-diferencial', title: 'Recta tangente a una parábola', sim: 'grapher',
    params: [
      { key: 'a', label: 'Coeficiente a', unit: '', min: 0.5, max: 3, step: 0.5, default: 1 },
      { key: 'b', label: 'Coeficiente b', unit: '', min: -4, max: 4, step: 1, default: -2 },
      { key: 'x0', label: 'Punto x₀', unit: '', min: -3, max: 3, step: 0.5, default: 2 },
    ],
    statement: (p) => `Para f(x) = ${p.a}x² ${sg(p.b)}x, encuentra la ecuación de la recta tangente en x₀ = ${p.x0}. Arrastra el punto sobre la gráfica o usa los controles.`,
    steps: [
      { label: 'Valor de la función f(x₀)', formula: 'f(x₀) = a·x₀² + b·x₀', unit: '', compute: (p) => p.a * p.x0 ** 2 + p.b * p.x0,
        hint: 'Sustituye x₀ en la función original. Cuidado con los signos al elevar al cuadrado.',
        diagnose: (u, p) => near(u, p.a * p.x0 * 2 + p.b * p.x0) ? 'Multiplicaste x₀ por 2 en lugar de elevarlo al cuadrado.' : null },
      { label: 'Pendiente m = f′(x₀)', formula: 'f′(x) = 2a·x + b', unit: '', compute: (p) => 2 * p.a * p.x0 + p.b,
        hint: 'Deriva con la regla de la potencia y evalúa en x₀.',
        diagnose: (u, p) => near(u, p.a * p.x0 ** 2 + p.b * p.x0) ? 'Evaluaste f(x₀), no la derivada f′(x₀).'
          : near(u, 2 * p.a * p.x0) ? 'La derivada de b·x es b: te faltó sumarla.'
          : near(u, p.a * p.x0 + p.b) ? 'Regla de la potencia: d/dx(ax²) = 2ax. Te faltó el factor 2.'
          : near(u, 2 * p.a + p.b) ? 'Encontraste f′(x) bien, pero evalúala en x = x₀.' : null },
      { label: 'Ordenada al origen de la tangente', formula: 'b_t = f(x₀) − m·x₀', unit: '', compute: (p) => (p.a * p.x0 ** 2 + p.b * p.x0) - (2 * p.a * p.x0 + p.b) * p.x0,
        hint: 'Usa punto-pendiente: y − f(x₀) = m(x − x₀) y despeja cuando x = 0.',
        diagnose: (u, p) => { const fx = p.a * p.x0 ** 2 + p.b * p.x0; const m = 2 * p.a * p.x0 + p.b; return near(u, fx + m * p.x0) ? 'Error de signo: b_t = f(x₀) − m·x₀.' : null; } },
    ],
    simProps: (p, set) => ({
      lockMode: 'derivada',
      customFn: { label: `f(x) = ${p.a}x² ${sg(p.b)}x`, f: (x) => p.a * x * x + p.b * x },
      x0: p.x0,
      onX0Change: (v) => set('x0', Math.round(Math.min(3, Math.max(-3, v)) * 2) / 2),
    }),
  },
];