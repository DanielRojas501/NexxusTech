import { Calculator, Triangle, Ruler, Sigma, Zap } from 'lucide-react';

export const BLOCKS = [
  {
    id: 'algebra',
    label: 'Aritmética y Álgebra Básica',
    desc: 'Leyes de exponentes, factorización, despeje de ecuaciones y fracciones algebraicas.',
    icon: Calculator,
    color: 'text-cyan-300',
    subjects: ['calculo-diferencial', 'metodos-numericos', 'fundamentos-programacion'],
  },
  {
    id: 'trig',
    label: 'Trigonometría e Identidades',
    desc: 'Razones trigonométricas, triangulación, identidades y leyes de senos/cosenos.',
    icon: Triangle,
    color: 'text-violet-300',
    subjects: ['fisica-dinamica', 'calculo-integral', 'estatica-estructuras'],
  },
  {
    id: 'geometry',
    label: 'Geometría Analítica y Vectores',
    desc: 'Ecuación de la recta, cónicas, suma vectorial y componentes rectangulares.',
    icon: Ruler,
    color: 'text-sky-300',
    subjects: ['calculo-diferencial', 'calculo-vectorial', 'estatica-estructuras'],
  },
  {
    id: 'calculus',
    label: 'Fundamentos de Cálculo',
    desc: 'Concepto intuitivo de límite, interpretación de pendientes y áreas.',
    icon: Sigma,
    color: 'text-emerald-300',
    subjects: ['calculo-diferencial', 'ecuaciones-diferenciales', 'metodos-numericos'],
  },
  {
    id: 'physics',
    label: 'Razonamiento Lógico-Físico',
    desc: 'Conversión de unidades, despeje de fórmulas y lectura de gráficas posición-tiempo.',
    icon: Zap,
    color: 'text-amber-300',
    subjects: ['fisica-dinamica', 'termodinamica', 'electricidad-magnetismo'],
  },
];

export const BASE_QUESTIONS = {
  algebra: [
    () => ({ text: 'Si 2ᵃ · 2ᵇ = 2¹⁰ y a = 3, ¿cuánto vale b?', answer: 7, hint: 'Cuando multiplicas potencias de la misma base, se suman los exponentes.' }),
    () => ({ text: 'Resuelve para x: 3(x − 4) = 2x + 5', answer: 17, hint: 'Distribuye, agrupa las x de un lado y los números del otro.' }),
    () => ({ text: 'La ecuación x² − 9x + 20 = 0 tiene dos raíces. ¿Cuánto vale la mayor?', answer: 5, hint: 'Busca dos números que multiplicados den 20 y sumados den −9.' }),
    () => ({ text: 'Evalúa la fracción algebraica (x² − 16)/(x + 4) en x = 6.', answer: 2, hint: 'x² − 16 se factoriza como (x−4)(x+4). Simplifica antes de evaluar.' }),
  ],
  trig: [
    () => ({ text: 'Calcula sin(30°) (2 decimales).', answer: 0.5, tol: 0.01, hint: 'Triángulo notable 30-60-90: la mitad de la hipotenusa.' }),
    () => ({ text: 'Si sin θ = 3/5 y θ está en el primer cuadrante, ¿cuánto vale cos θ? (2 decimales)', answer: 0.6, tol: 0.01, hint: 'Identidad fundamental: sin²θ + cos²θ = 1.' }),
    () => ({ text: 'Un triángulo tiene dos lados de 5 y 8 con un ángulo de 60° entre ellos. ¿Cuánto mide el tercer lado?', answer: 7, tol: 0.02, hint: 'Ley de cosenos: c² = a² + b² − 2ab·cos(60°).' }),
    () => ({ text: 'En un triángulo 45-45-90 la hipotenusa mide 10. ¿Cuánto mide un cateto? (2 decimales)', answer: 7.07, tol: 0.02, hint: 'Los catetos miden hipotenusa/√2.' }),
  ],
  geometry: [
    () => ({ text: 'Calcula la pendiente de la recta que pasa por (1, 2) y (4, 11).', answer: 3, hint: 'm = (y₂ − y₁)/(x₂ − x₁).' }),
    () => ({ text: '¿Cuánto vale la distancia entre los puntos (0, 0) y (3, 4)?', answer: 5, hint: 'Es un triángulo 3-4-5: usa el teorema de Pitágoras.' }),
    () => ({ text: '¿Cuánto vale la magnitud del vector A = (2, 3, 6)?', answer: 7, hint: '|A| = √(4 + 9 + 36).' }),
    () => ({ text: '¿Cuál es el radio de la circunferencia x² + y² − 4x = 0?', answer: 2, hint: 'Completa el cuadrado: (x − 2)² + y² = 4.' }),
  ],
  calculus: [
    () => ({ text: 'Calcula el límite: lim x→3 de (x² − 9)/(x − 3).', answer: 6, hint: 'Factoriza el numerador y simplifica.' }),
    () => ({ text: 'Si f(x) = x², ¿cuánto vale f′(3)?', answer: 6, hint: 'La derivada de x² es 2x.' }),
    () => ({ text: '¿Cuál es la pendiente de la recta tangente a f(x) = x³ en x = 1?', answer: 3, hint: 'f′(x) = 3x².' }),
    () => ({ text: '¿Cuál es el área exacta bajo v(t) = t desde t = 0 hasta t = 4?', answer: 8, hint: 'Es un triángulo: base 4, altura 4.' }),
  ],
  physics: [
    () => ({ text: '¿Cuántos metros hay en 2.5 km?', answer: 2500, hint: '1 km = 1000 m.' }),
    () => ({ text: 'Si v = d/t, ¿qué velocidad (m/s) corresponde a 150 m recorridos en 30 s?', answer: 5, hint: 'Divide distancia entre tiempo.' }),
    () => ({ text: 'Un móvil pasa de x = 10 m a x = 40 m en 5 s. ¿Cuál es su velocidad (m/s)?', answer: 6, hint: 'v = Δx/Δt.' }),
    () => ({ text: 'Si F = ma, con F = 20 N y m = 4 kg, ¿cuánto vale a (m/s²)?', answer: 5, hint: 'Despeja: a = F/m.' }),
  ],
};

export const FOLLOW_UPS = {
  algebra: [
    () => ({ text: 'Calcula 2⁰ + 2⁻³ (3 decimales).', answer: 1.125, tol: 0.01, hint: 'Cualquier número elevado a 0 es 1; el exponente negativo pasa al denominador.' }),
    () => ({ text: 'En V = (1/3)πr²h, si V = 12π y r = 3, ¿cuánto vale h?', answer: 4, hint: 'Multiplica ambos lados por 3 y despeja h.' }),
    () => ({ text: 'Si 2x + y = 10 y x − y = 2, ¿cuánto vale x?', answer: 4, hint: 'Suma ambas ecuaciones para eliminar y.' }),
  ],
  trig: [
    () => ({ text: 'Calcula cos(60°) (2 decimales).', answer: 0.5, tol: 0.01, hint: 'Triángulo notable 30-60-90.' }),
    () => ({ text: 'Calcula tan(45°) (2 decimales).', answer: 1, tol: 0.01, hint: 'cateto opuesto = cateto adyacente.' }),
    () => ({ text: 'Por ley de senos: a = 6, A = 30°, B = 45°. ¿Cuánto vale b? (2 decimales)', answer: 8.49, tol: 0.05, hint: 'b = a·sin(B)/sin(A).' }),
  ],
  geometry: [
    () => ({ text: 'Si A = (1, 2) y B = (3, 4), ¿cuánto vale el producto punto A · B?', answer: 11, hint: 'Multiplica componente a componente y suma.' }),
    () => ({ text: '¿Cuál es la coordenada x del punto medio entre (2, 5) y (6, 9)?', answer: 4, hint: 'Promedia las coordenadas x.' }),
    () => ({ text: 'Si A = (3, −1) y B = (−1, 4), ¿cuánto vale |A + B|? (2 decimales)', answer: 3.61, tol: 0.05, hint: 'Suma componente a componente y luego calcula la magnitud.' }),
  ],
  calculus: [
    () => ({ text: 'Calcula el límite: lim x→2 de (x² − 4)/(x − 2).', answer: 4, hint: 'Factoriza como diferencia de cuadrados.' }),
    () => ({ text: 'Si f(x) = 3x² + 2x, ¿cuánto vale f′(1)?', answer: 8, hint: 'f′(x) = 6x + 2.' }),
    () => ({ text: 'Calcula la integral ∫₀² 3x dx.', answer: 6, hint: 'La antiderivada de 3x es 3x²/2.' }),
  ],
  physics: [
    () => ({ text: 'Convierte 72 km/h a m/s.', answer: 20, tol: 0.1, hint: 'Divide entre 3.6.' }),
    () => ({ text: 'E = mgh, con m = 2 kg, g = 10 m/s² y h = 5 m. ¿Cuánto vale E (J)?', answer: 100, hint: 'Multiplica los tres valores.' }),
    () => ({ text: 'Un móvil con velocidad constante de −5 m/s parte de x = 20 m. ¿En qué posición (m) está a los 4 s?', answer: 0, hint: 'x = x₀ + v·t.' }),
  ],
};