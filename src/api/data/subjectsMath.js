export const MATH_SUBJECTS = [
  {
    id: 'calculo-diferencial', name: 'Cálculo Diferencial', area: 'matematicas', icon: 'Sigma', sim: 'grapher',
    description: 'Límites, derivadas, optimización y razones de cambio: el lenguaje del cambio instantáneo.',
    syllabus: ['Funciones y modelos', 'Límites y continuidad', 'Definición de derivada', 'Reglas de derivación', 'Regla de la cadena', 'Derivación implícita', 'Razones de cambio relacionadas', 'Optimización'],
    modules: [
      {
        title: 'Límites y formas indeterminadas',
        theory: 'El límite describe el valor al que se aproxima f(x) cuando x se acerca a un punto a, sin importar lo que pase exactamente en a. Si la sustitución directa da 0/0, la expresión es indeterminada: factoriza, racionaliza o usa límites notables para eliminar el factor problemático.',
        formula: 'lím(x→a) f(x) = L',
        example: { statement: 'Calcula lím(x→2) (x² − 4)/(x − 2).', steps: ['Sustitución directa: (4 − 4)/(2 − 2) = 0/0 → indeterminado.', 'Factoriza el numerador: (x − 2)(x + 2)/(x − 2).', 'Cancela el factor común: x + 2.', 'Evalúa en x = 2: 2 + 2.'], result: '4' },
        exercises: [
          { q: 'Calcula lím(x→3) (x² − 9)/(x − 3).', answer: 6, hint: 'Factoriza la diferencia de cuadrados: x² − 9 = (x − 3)(x + 3).' },
          { q: 'Calcula lím(x→0) sin(5x)/x.', answer: 5, hint: 'Multiplica y divide entre 5 para usar lím sin(u)/u = 1 con u = 5x.' },
        ],
      },
      {
        title: 'Derivadas, razones de cambio y optimización',
        theory: 'La derivada f′(x) es la pendiente de la recta tangente y mide la rapidez de cambio instantánea. En optimización, los máximos y mínimos ocurren donde f′(x) = 0 (puntos críticos). En razones relacionadas, derivas implícitamente respecto al tiempo.',
        formula: "f′(x) = lím(h→0) [f(x + h) − f(x)] / h",
        example: { statement: 'Maximiza el área de un rectángulo con perímetro de 40 m.', steps: ['Perímetro: 2x + 2y = 40 → y = 20 − x.', 'Área: A(x) = x(20 − x) = 20x − x².', 'Deriva: A′(x) = 20 − 2x = 0 → x = 10.', 'y = 10, A = 10 · 10.'], result: 'A máx = 100 m²' },
        exercises: [
          { q: 'Si f(x) = 3x⁴ − 2x, calcula f′(1).', answer: 10, hint: 'Regla de la potencia: d/dx(3x⁴) = 12x³; la derivada de −2x es −2.' },
          { q: 'Un globo esférico se infla a 10 cm³/s. ¿A qué razón (cm/s) crece el radio cuando r = 5 cm?', answer: 0.0318, tol: 0.03, hint: 'V = (4/3)πr³ → dV/dt = 4πr² · dr/dt. Despeja dr/dt.' },
        ],
      },
    ],
  },
  {
    id: 'calculo-integral', name: 'Cálculo Integral', area: 'matematicas', icon: 'Infinity', sim: 'riemann',
    description: 'Integrales definidas e indefinidas, métodos de integración y volúmenes de revolución.',
    syllabus: ['Antiderivadas', 'Sumas de Riemann', 'Teorema fundamental del cálculo', 'Sustitución', 'Integración por partes', 'Fracciones parciales', 'Área entre curvas', 'Volúmenes de revolución'],
    modules: [
      {
        title: 'Integral definida y sumas de Riemann',
        theory: 'La integral definida es el límite de sumas de áreas de rectángulos bajo la curva. El Teorema Fundamental del Cálculo permite calcularla con una antiderivada: evalúas F en los extremos y restas.',
        formula: '∫ₐᵇ f(x) dx = F(b) − F(a)',
        example: { statement: 'Calcula ∫₀² x² dx.', steps: ['Antiderivada: F(x) = x³/3.', 'Evalúa en b = 2: 8/3.', 'Evalúa en a = 0: 0.', 'Resta: 8/3 − 0.'], result: '2.667' },
        exercises: [
          { q: 'Calcula ∫₁³ (2x + 1) dx.', answer: 10, hint: 'La antiderivada es x² + x. Evalúa en 3 y en 1 y resta.' },
          { q: 'Calcula ∫₀^π sin(x) dx.', answer: 2, hint: 'La antiderivada de sin(x) es −cos(x). Cuida los signos: −cos(π) − (−cos 0).' },
        ],
      },
      {
        title: 'Métodos de integración y volúmenes',
        theory: 'Para integrales complejas usa sustitución (u = g(x)) o partes (∫u dv = uv − ∫v du). El método de discos calcula el volumen al girar una región alrededor de un eje, sumando discos de radio f(x).',
        formula: 'V = π ∫ₐᵇ [f(x)]² dx',
        example: { statement: 'Volumen al girar y = √x, 0 ≤ x ≤ 4, alrededor del eje x.', steps: ['Radio del disco: f(x) = √x → f² = x.', 'V = π ∫₀⁴ x dx.', 'Antiderivada: x²/2 → 16/2 = 8.', 'V = 8π.'], result: '25.13 u³' },
        exercises: [
          { q: 'Volumen al girar y = x, 0 ≤ x ≤ 3, alrededor del eje x.', answer: 28.274, hint: 'V = π∫₀³ x² dx = π · 27/3.' },
          { q: 'Calcula ∫₀¹ x·eˣ dx (integración por partes).', answer: 1, hint: 'u = x, dv = eˣdx → xeˣ − eˣ evaluado de 0 a 1.' },
        ],
      },
    ],
  },
  {
    id: 'calculo-vectorial', name: 'Cálculo Vectorial', area: 'matematicas', icon: 'Axis3d', sim: 'vector3d',
    description: 'Vectores en 2D/3D, productos punto y cruz, gradientes y campos en el espacio.',
    syllabus: ['Vectores en 2D y 3D', 'Producto punto', 'Producto cruz', 'Rectas y planos', 'Funciones vectoriales', 'Derivadas parciales', 'Gradiente y derivada direccional', 'Integrales múltiples'],
    modules: [
      {
        title: 'Producto punto y producto cruz',
        theory: 'El producto punto da un escalar que mide qué tanto apuntan dos vectores en la misma dirección; si es 0 son perpendiculares. El producto cruz da un vector perpendicular a ambos, cuya magnitud es el área del paralelogramo que forman.',
        formula: 'A·B = |A||B|cos θ     |A×B| = |A||B|sin θ',
        example: { statement: 'A = (3, −2, 5), B = (1, 4, −2). Calcula A·B, A×B y θ.', steps: ['A·B = 3(1) + (−2)(4) + 5(−2) = 3 − 8 − 10 = −15.', 'A×B = ((−2)(−2) − 5·4, 5·1 − 3(−2), 3·4 − (−2)·1) = (−16, 11, 14).', '|A| = √38 ≈ 6.164, |B| = √21 ≈ 4.583.', 'cos θ = −15 / 28.25 ≈ −0.531 → θ ≈ 122.1°.'], result: 'θ ≈ 122.1°' },
        exercises: [
          { q: 'Calcula A·B para A = (1, 2, 3) y B = (4, −5, 6).', answer: 12, hint: 'Multiplica componente a componente y suma: 4 − 10 + 18.' },
          { q: '¿Cuál es el ángulo (en grados) entre (1, 0, 0) y (1, 1, 0)?', answer: 45, hint: 'cos θ = A·B / (|A||B|) = 1 / √2.' },
        ],
      },
      {
        title: 'Derivadas parciales y gradiente',
        theory: 'La derivada parcial mide el cambio respecto a una variable manteniendo las demás constantes. El gradiente reúne todas las parciales y apunta en la dirección de máximo crecimiento; su magnitud es la razón de cambio máxima.',
        formula: '∇f = (∂f/∂x, ∂f/∂y, ∂f/∂z)',
        example: { statement: 'Calcula ∇f para f = x²y + yz en (1, 2, 3).', steps: ['∂f/∂x = 2xy → 2(1)(2) = 4.', '∂f/∂y = x² + z → 1 + 3 = 4.', '∂f/∂z = y → 2.'], result: '∇f = (4, 4, 2)' },
        exercises: [
          { q: 'Para f(x, y) = x² + y², calcula |∇f| en (3, 4).', answer: 10, hint: '∇f = (2x, 2y) = (6, 8). Su magnitud es √(36 + 64).' },
          { q: 'Si f = x³y², calcula ∂f/∂y en (1, 2).', answer: 4, hint: 'Trata x como constante: ∂f/∂y = 2x³y.' },
        ],
      },
    ],
  },
  {
    id: 'algebra-lineal', name: 'Álgebra Lineal', area: 'matematicas', icon: 'Grid3x3', sim: 'vector3d',
    description: 'Matrices, determinantes, sistemas de ecuaciones, valores y vectores propios.',
    syllabus: ['Matrices y operaciones', 'Determinantes', 'Matriz inversa', 'Sistemas de ecuaciones', 'Eliminación de Gauss-Jordan', 'Espacios vectoriales', 'Transformaciones lineales', 'Valores y vectores propios'],
    modules: [
      {
        title: 'Determinantes y sistemas de ecuaciones',
        theory: 'El determinante indica si una matriz es invertible (det ≠ 0) y escala áreas/volúmenes. La regla de Cramer resuelve sistemas cuadrados reemplazando columnas por el vector de resultados.',
        formula: 'det [[a, b], [c, d]] = ad − bc     xᵢ = det(Aᵢ)/det(A)',
        example: { statement: 'Resuelve 2x + y = 5, x − y = 1.', steps: ['det(A) = 2(−1) − 1(1) = −3.', 'det(Aₓ) = 5(−1) − 1(1) = −6 → x = −6/−3 = 2.', 'det(Aᵧ) = 2(1) − 5(1) = −3 → y = −3/−3 = 1.'], result: 'x = 2, y = 1' },
        exercises: [
          { q: 'Calcula det [[3, 2], [1, 4]].', answer: 10, hint: 'ad − bc = 3·4 − 2·1.' },
          { q: 'Calcula det [[1, 2, 3], [0, 1, 4], [5, 6, 0]].', answer: 1, hint: 'Expande por la primera fila: 1(0 − 24) − 2(0 − 20) + 3(0 − 5).' },
        ],
      },
      {
        title: 'Valores y vectores propios',
        theory: 'Un vector propio v de A solo se escala al transformarse: Av = λv. Los valores propios λ se obtienen del polinomio característico. Son clave en vibraciones, estabilidad y análisis de componentes.',
        formula: 'det(A − λI) = 0',
        example: { statement: 'Valores propios de A = [[4, 1], [2, 3]].', steps: ['A − λI = [[4 − λ, 1], [2, 3 − λ]].', '(4 − λ)(3 − λ) − 2 = λ² − 7λ + 10.', 'Factoriza: (λ − 5)(λ − 2) = 0.'], result: 'λ = 5, λ = 2' },
        exercises: [
          { q: '¿Cuál es el mayor valor propio de [[2, 0], [0, 7]]?', answer: 7, hint: 'En una matriz diagonal los valores propios son los elementos de la diagonal.' },
          { q: '¿Cuál es el mayor valor propio de [[1, 2], [2, 1]]?', answer: 3, hint: 'Polinomio: (1 − λ)² − 4 = 0 → 1 − λ = ±2.' },
        ],
      },
    ],
  },
  {
    id: 'ecuaciones-diferenciales', name: 'Ecuaciones Diferenciales', area: 'matematicas', icon: 'Waves', sim: 'oscillator',
    description: 'EDOs de 1er y 2do orden, transformadas de Laplace y sistemas oscilatorios.',
    syllabus: ['Clasificación de EDOs', 'Variables separables', 'Lineales de 1er orden', 'Ecuaciones exactas', '2do orden homogéneas', 'Coeficientes indeterminados', 'Transformada de Laplace', 'Osciladores y vibraciones'],
    modules: [
      {
        title: 'EDOs de primer orden',
        theory: 'Una EDO relaciona una función con sus derivadas. Las de variables separables se integran agrupando cada variable en un lado. Crecimiento y decaimiento exponencial siguen dy/dt = ky, con solución y = y₀e^(kt).',
        formula: 'dy/dt = k·y  →  y(t) = y₀·e^(kt)',
        example: { statement: 'dy/dt = −0.5y, y(0) = 100. Calcula y(2).', steps: ['Separa: dy/y = −0.5 dt.', 'Integra: ln y = −0.5t + C → y = y₀e^(−0.5t).', 'y(2) = 100·e^(−1).'], result: '36.79' },
        exercises: [
          { q: 'dy/dt = 0.1y, y(0) = 50. Calcula y(10).', answer: 135.914, hint: 'y = 50·e^(0.1·10) = 50e.' },
          { q: 'dy/dx = 2x, y(0) = 3. Calcula y(2).', answer: 7, hint: 'Integra: y = x² + C; usa y(0) = 3 para hallar C.' },
        ],
      },
      {
        title: 'Oscilador masa-resorte',
        theory: 'Un sistema masa-resorte obedece m·x″ + c·x′ + k·x = 0. Sin amortiguamiento oscila con frecuencia natural ω₀ = √(k/m). El amortiguamiento c hace decaer la amplitud.',
        formula: 'ω₀ = √(k/m)     T = 2π/ω₀',
        example: { statement: 'm = 2 kg, k = 50 N/m. Calcula ω₀ y T.', steps: ['ω₀ = √(50/2) = √25 = 5 rad/s.', 'T = 2π/5.'], result: 'T ≈ 1.257 s' },
        exercises: [
          { q: 'm = 0.5 kg, k = 200 N/m. Calcula ω₀ (rad/s).', answer: 20, hint: 'ω₀ = √(k/m) = √400.' },
          { q: 'm = 1 kg, k = 100 N/m. Calcula la frecuencia f (Hz).', answer: 1.5915, hint: 'ω₀ = 10 rad/s; f = ω₀/(2π).' },
        ],
      },
    ],
  },
  {
    id: 'metodos-numericos', name: 'Métodos Numéricos', area: 'matematicas', icon: 'Calculator', sim: 'grapher',
    description: 'Raíces de ecuaciones, interpolación, integración numérica y ajuste de curvas.',
    syllabus: ['Errores y precisión', 'Método de bisección', 'Newton-Raphson', 'Método de la secante', 'Interpolación', 'Mínimos cuadrados', 'Regla del trapecio', 'Simpson 1/3'],
    modules: [
      {
        title: 'Raíces: bisección y Newton-Raphson',
        theory: 'Bisección parte un intervalo con cambio de signo a la mitad hasta encerrar la raíz: lento pero seguro. Newton-Raphson usa la tangente para saltar hacia la raíz: converge muy rápido si el punto inicial es bueno.',
        formula: 'xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ)',
        example: { statement: 'Aproxima √2 con f(x) = x² − 2, x₀ = 1.', steps: ['f(1) = −1, f′(1) = 2 → x₁ = 1 + 0.5 = 1.5.', 'f(1.5) = 0.25, f′ = 3 → x₂ = 1.5 − 0.0833 = 1.4167.', 'x₃ ≈ 1.41422.'], result: '√2 ≈ 1.41421' },
        exercises: [
          { q: 'f(x) = x² − 5, x₀ = 2. Calcula x₁ con Newton-Raphson.', answer: 2.25, hint: 'f(2) = −1, f′(2) = 4 → x₁ = 2 − (−1/4).' },
          { q: 'Bisección para x³ − x − 2 en [1, 2]. ¿Cuál es el punto medio de la 2ª iteración?', answer: 1.75, hint: 'f(1.5) = −0.125 < 0, así que la raíz está en [1.5, 2].' },
        ],
      },
      {
        title: 'Integración numérica',
        theory: 'Cuando no hay antiderivada sencilla, aproximamos el área con trapecios o parábolas (Simpson). Simpson 1/3 es exacto para polinomios de hasta grado 3.',
        formula: 'Trapecio: (h/2)[f₀ + 2Σfᵢ + fₙ]     Simpson: (h/3)[f₀ + 4f₁ + f₂]',
        example: { statement: '∫₀² x² dx con trapecio, n = 2.', steps: ['h = 1; f(0) = 0, f(1) = 1, f(2) = 4.', '(1/2)[0 + 2(1) + 4] = 3.', 'Valor exacto: 2.667 → error ≈ 12.5 %.'], result: '≈ 3' },
        exercises: [
          { q: '∫₀² x² dx con Simpson 1/3, n = 2.', answer: 2.6667, hint: '(h/3)[f₀ + 4f₁ + f₂] con h = 1.' },
          { q: '∫₀¹ eˣ dx con trapecio, n = 1.', answer: 1.859, hint: '(1/2)[e⁰ + e¹].' },
        ],
      },
    ],
  },
  {
    id: 'probabilidad-estadistica', name: 'Probabilidad y Estadística', area: 'matematicas', icon: 'TrendingUp', sim: null,
    description: 'Distribuciones, regresión, intervalos de confianza y pruebas de hipótesis.',
    syllabus: ['Estadística descriptiva', 'Probabilidad y conteo', 'Teorema de Bayes', 'Distribución binomial', 'Distribución normal', 'Intervalos de confianza', 'Pruebas de hipótesis', 'Regresión lineal'],
    modules: [
      {
        title: 'Distribución binomial',
        theory: 'Modela el número de éxitos en n ensayos independientes con probabilidad de éxito p constante. Su media es np y su varianza np(1 − p).',
        formula: 'P(X = k) = C(n, k)·pᵏ·(1 − p)ⁿ⁻ᵏ',
        example: { statement: 'n = 5, p = 0.5. Calcula P(X = 2).', steps: ['C(5, 2) = 10.', 'p² = 0.25, (1 − p)³ = 0.125.', '10 · 0.25 · 0.125.'], result: '0.3125' },
        exercises: [
          { q: 'n = 4, p = 0.2. Calcula P(X = 0).', answer: 0.4096, hint: 'Solo queda (1 − p)ⁿ = 0.8⁴.' },
          { q: 'Media de una binomial con n = 20, p = 0.3.', answer: 6, hint: 'μ = n·p.' },
        ],
      },
      {
        title: 'Prueba de hipótesis con z',
        theory: 'Contrastamos H₀ calculando cuántos errores estándar se aleja la media muestral del valor supuesto. Con α = 0.05 bilateral, se rechaza H₀ si |z| > 1.96.',
        formula: 'z = (x̄ − μ₀)/(σ/√n)',
        example: { statement: 'x̄ = 52, μ₀ = 50, σ = 8, n = 64.', steps: ['Error estándar: 8/√64 = 1.', 'z = (52 − 50)/1 = 2.', '|2| > 1.96 → se rechaza H₀.'], result: 'z = 2, rechazar H₀' },
        exercises: [
          { q: 'x̄ = 103, μ₀ = 100, σ = 12, n = 36. Calcula z.', answer: 1.5, hint: 'Error estándar = 12/6 = 2.' },
          { q: 'Con z = 1.5 y α = 0.05 bilateral, ¿qué decides?', options: ['Rechazar H₀', 'No rechazar H₀'], answer: 1, hint: 'Compara |z| con el valor crítico 1.96.' },
        ],
      },
    ],
  },
];