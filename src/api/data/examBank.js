const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[ri(0, arr.length - 1)];
const sg = (b) => `${b >= 0 ? '+' : '−'} ${Math.abs(b)}`;

const BANK = [
  { area: 'Matemáticas', subject: 'Cálculo Diferencial', gen: () => { const a = ri(1, 4), b = ri(-5, 5), c = ri(1, 3); return { text: `Si f(x) = ${a}x³ ${sg(b)}x, calcula f′(${c}).`, answer: 3 * a * c * c + b }; } },
  { area: 'Matemáticas', subject: 'Cálculo Integral', gen: () => { const m = ri(1, 6), n = ri(0, 5), b = ri(1, 4); return { text: `Calcula ∫₀^${b} (${m}x + ${n}) dx.`, answer: (m * b * b) / 2 + n * b }; } },
  { area: 'Matemáticas', subject: 'Álgebra Lineal', gen: () => { const [a, b, c, d] = [ri(-5, 9), ri(-5, 9), ri(-5, 9), ri(-5, 9)]; return { text: `Calcula el determinante de [[${a}, ${b}], [${c}, ${d}]].`, answer: a * d - b * c }; } },
  { area: 'Matemáticas', subject: 'Cálculo Vectorial', gen: () => { const A = [ri(-4, 5), ri(-4, 5), ri(-4, 5)], B = [ri(-4, 5), ri(-4, 5), ri(-4, 5)]; return { text: `Calcula A·B para A = (${A.join(', ')}) y B = (${B.join(', ')}).`, answer: A[0] * B[0] + A[1] * B[1] + A[2] * B[2] }; } },
  { area: 'Matemáticas', subject: 'Ecuaciones Diferenciales', gen: () => { const m = pick([0.5, 1, 2, 4]), k = pick([16, 36, 64, 100]); return { text: `Un sistema masa-resorte tiene m = ${m} kg y k = ${k} N/m. Calcula ω₀.`, answer: Math.sqrt(k / m), unit: 'rad/s' }; } },
  { area: 'Matemáticas', subject: 'Probabilidad y Estadística', gen: () => { const n = ri(3, 6), p = pick([0.1, 0.2, 0.3]); return { text: `X ~ Binomial(n = ${n}, p = ${p}). Calcula P(X = 0).`, answer: (1 - p) ** n }; } },
  { area: 'Física', subject: 'Física General / Dinámica', gen: () => { const rpm = pick([120, 180, 240, 300]), r = pick([0.3, 0.5, 0.8]); return { text: `Una hélice de ${r} m de radio gira a ${rpm} RPM. Calcula la velocidad tangencial en la punta.`, answer: ((2 * Math.PI * rpm) / 60) * r, unit: 'm/s' }; } },
  { area: 'Física', subject: 'Física General / Dinámica', gen: () => { const m = ri(2, 10), F = ri(20, 80), mu = pick([0.1, 0.2, 0.25]); return { text: `Un bloque de ${m} kg es jalado con ${F} N sobre una superficie con μk = ${mu} (g = 9.81 m/s²). Calcula su aceleración.`, answer: (F - mu * m * 9.81) / m, unit: 'm/s²' }; } },
  { area: 'Física', subject: 'Electricidad y Magnetismo', gen: () => { const R = pick([1000, 2000, 4700, 10000]), C = pick([0.0001, 0.00022, 0.0005]); return { text: `Calcula la constante de tiempo de un circuito RC con R = ${R} Ω y C = ${C * 1e6} μF.`, answer: R * C, unit: 's' }; } },
  { area: 'Física', subject: 'Termodinámica', gen: () => { const Th = pick([500, 600, 800, 900]), Tc = pick([280, 300, 350]); return { text: `Calcula la eficiencia de Carnot (en %) entre ${Th} K y ${Tc} K.`, answer: (1 - Tc / Th) * 100, unit: '%' }; } },
  { area: 'Química/Materiales', subject: 'Química General', gen: () => { const n = ri(1, 4), T = pick([273, 300, 350]), V = pick([5, 10, 20]); return { text: `Calcula la presión de ${n} mol de gas ideal a ${T} K en ${V} L (R = 0.08206).`, answer: (n * 0.08206 * T) / V, unit: 'atm' }; } },
  { area: 'Administración', subject: 'Ingeniería Económica', gen: () => { const P = pick([5000, 10000, 20000]), i = pick([0.05, 0.08, 0.1]), n = ri(2, 5); return { text: `Invierte $${P} al ${i * 100} % anual compuesto durante ${n} años. Calcula el valor futuro.`, answer: P * (1 + i) ** n, unit: '$' }; } },
];

export function buildExam(count) {
  return [...BANK]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((b, i) => ({ id: i, area: b.area, subject: b.subject, unit: '', ...b.gen() }));
}