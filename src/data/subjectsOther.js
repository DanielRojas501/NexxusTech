export const OTHER_SUBJECTS = [
  {
    id: 'investigacion-operaciones', name: 'Investigación de Operaciones', area: 'operaciones', icon: 'Network', sim: 'network',
    description: 'Programación lineal con Simplex, teoría de redes y modelos de transporte.',
    syllabus: ['Modelado de programación lineal', 'Método gráfico', 'Método Simplex', 'Dualidad y sensibilidad', 'Modelo de transporte', 'Modelo de asignación', 'Ruta más corta', 'Flujo máximo y CPM'],
    modules: [
      {
        title: 'Método Simplex',
        theory: 'Simplex recorre los vértices de la región factible mejorando Z en cada iteración. Entra la variable con el coeficiente más negativo en la fila Z (columna pivote) y sale la de menor razón LD/coeficiente positivo (fila pivote).',
        formula: 'Razón = LD / coef. columna pivote (solo > 0)',
        example: { statement: 'Máx Z = 3x₁ + 5x₂ s.a. x₁ ≤ 4, 2x₂ ≤ 12, 3x₁ + 2x₂ ≤ 18.', steps: ['Entra x₂ (−5); razones 12/2 = 6, 18/2 = 9 → sale s₂.', 'Entra x₁ (−3); razones 4/1 = 4, 6/3 = 2 → sale s₃.', 'Fila Z sin negativos → óptimo.'], result: 'x₁ = 2, x₂ = 6, Z = 36' },
        exercises: [
          { q: 'Fila Z: [−3, −5, 0, 0, 0]. ¿Qué variable entra?', options: ['x₁', 'x₂', 's₁'], answer: 1, hint: 'Elige el coeficiente más negativo.' },
          { q: 'LD = [4, 12, 18], columna pivote = [0, 2, 2]. ¿Razón mínima?', answer: 6, hint: 'Ignora coeficientes ≤ 0: 12/2 y 18/2.' },
        ],
      },
      {
        title: 'Redes y transporte',
        theory: 'El flujo máximo de una red es igual a la capacidad de su corte mínimo. En transporte, si oferta ≠ demanda se agrega un nodo ficticio con costo cero para balancear.',
        formula: 'Flujo máximo = capacidad del corte mínimo',
        example: { statement: 'Oferta total 150, demanda total 120.', steps: ['Diferencia: 150 − 120 = 30.', 'Se agrega un destino ficticio de 30 unidades con costo 0.'], result: 'Destino ficticio = 30' },
        exercises: [
          { q: 'El corte mínimo cruza aristas de capacidad 7 y 5. ¿Flujo máximo?', answer: 12, hint: 'Suma las capacidades del corte mínimo.' },
          { q: 'Oferta 120, demanda 90. ¿Unidades del destino ficticio?', answer: 30, hint: 'Balancea con la diferencia.' },
        ],
      },
    ],
  },
  {
    id: 'fundamentos-programacion', name: 'Fundamentos de Programación', area: 'programacion', icon: 'Code', sim: null,
    description: 'Algoritmos, condicionales, ciclos, arreglos y lógica de código.',
    syllabus: ['Algoritmos y pseudocódigo', 'Diagramas de flujo', 'Variables y tipos de datos', 'Operadores y expresiones', 'Condicionales', 'Ciclos for y while', 'Arreglos', 'Funciones y modularidad'],
    modules: [
      {
        title: 'Condicionales y ciclos',
        theory: 'Un condicional elige un camino según una expresión booleana. Un ciclo repite un bloque mientras se cumpla una condición. Rastrear variables en una tabla (prueba de escritorio) evita errores.',
        formula: 'for (inicio; condición; incremento) { … }',
        example: { statement: 'suma = 0; for i = 1 to 5: suma += i', steps: ['i=1 → 1', 'i=2 → 3', 'i=3 → 6', 'i=4 → 10', 'i=5 → 15'], result: 'suma = 15' },
        exercises: [
          { q: '¿Cuántas veces se ejecuta el cuerpo de for (i = 0; i < 10; i += 2)?', answer: 5, hint: 'i toma los valores 0, 2, 4, 6, 8.' },
          { q: 'x = 7; if (x % 2 == 0) print("par") else print("impar"). ¿Qué imprime?', options: ['par', 'impar', 'Error'], answer: 1, hint: '7 % 2 = 1.' },
        ],
      },
      {
        title: 'Arreglos',
        theory: 'Un arreglo guarda elementos en posiciones consecutivas indexadas desde 0. Recorrerlo con un ciclo permite sumar, buscar o encontrar máximos.',
        formula: 'arr[i], i = 0 … n − 1',
        example: { statement: 'Máximo de [3, 9, 2, 7].', steps: ['max = 3.', '9 > 3 → max = 9.', '2 y 7 no superan 9.'], result: 'max = 9' },
        exercises: [
          { q: 'arr = [4, 8, 15, 16, 23, 42]. ¿Valor de arr[3]?', answer: 16, hint: 'Los índices empiezan en 0.' },
          { q: 'Suma de todos los elementos de arr = [4, 8, 15, 16, 23, 42].', answer: 108, hint: 'Acumula en un ciclo.' },
        ],
      },
    ],
  },
  {
    id: 'ingenieria-economica', name: 'Contabilidad de Costos e Ingeniería Económica', area: 'administracion', icon: 'Coins', sim: null,
    description: 'Punto de equilibrio, interés compuesto, VPN y TIR para decidir inversiones.',
    syllabus: ['Costos fijos y variables', 'Punto de equilibrio', 'Valor del dinero en el tiempo', 'Interés simple y compuesto', 'Anualidades', 'Valor presente neto (VPN)', 'Tasa interna de retorno (TIR)', 'Depreciación'],
    modules: [
      {
        title: 'Punto de equilibrio e interés compuesto',
        theory: 'El punto de equilibrio es la cantidad donde ingresos = costos totales. El interés compuesto capitaliza intereses sobre intereses: el dinero crece exponencialmente.',
        formula: 'Q* = CF/(P − CV)     F = P(1 + i)ⁿ',
        example: { statement: 'CF = $50 000, P = $120, CV = $70.', steps: ['Margen de contribución: 120 − 70 = 50.', 'Q* = 50 000/50.'], result: 'Q* = 1000 unidades' },
        exercises: [
          { q: 'CF = 30 000, P = 50, CV = 35. Punto de equilibrio (unidades).', answer: 2000, hint: 'Q* = CF/(P − CV).' },
          { q: '$10 000 al 10 % anual compuesto por 3 años. Valor futuro.', answer: 13310, hint: 'F = 10 000·(1.1)³.' },
        ],
      },
      {
        title: 'VPN y TIR',
        theory: 'El VPN trae todos los flujos al presente con la tasa mínima atractiva; si VPN > 0 el proyecto conviene. La TIR es la tasa que hace VPN = 0.',
        formula: 'VPN = −I₀ + Σ Fₜ/(1 + i)ᵗ',
        example: { statement: 'I₀ = 1000, flujos de 600 en años 1 y 2, i = 10 %.', steps: ['600/1.1 = 545.45.', '600/1.21 = 495.87.', 'VPN = 545.45 + 495.87 − 1000.'], result: 'VPN = 41.32 → conviene' },
        exercises: [
          { q: 'I₀ = 5000, flujos de 3000 en años 1 y 2, i = 10 %. VPN.', answer: 206.61, hint: '3000/1.1 + 3000/1.21 − 5000.' },
          { q: 'Inviertes 100 y recibes 110 en un año. TIR (%).', answer: 10, hint: '−100 + 110/(1 + TIR) = 0.' },
        ],
      },
    ],
  },
  {
    id: 'dibujo-tecnico', name: 'Diseño Industrial y Dibujo Técnico', area: 'operaciones', icon: 'PenTool', sim: 'vector3d',
    description: 'Vistas ortogonales, escalas, acotado e interpretación de geometría 3D.',
    syllabus: ['Instrumentos y normas', 'Escalas', 'Proyecciones ortogonales', 'Primer y tercer diedro', 'Acotado', 'Cortes y secciones', 'Dibujo isométrico', 'Modelado 3D'],
    modules: [
      {
        title: 'Escalas',
        theory: 'La escala relaciona la medida del dibujo con la real. 1:50 significa que 1 unidad del dibujo equivale a 50 reales (reducción); 2:1 es una ampliación.',
        formula: 'Medida real = medida en dibujo × factor de escala',
        example: { statement: 'Plano a 1:50, una línea mide 4 cm.', steps: ['Real = 4 × 50.'], result: '200 cm = 2 m' },
        exercises: [
          { q: 'Escala 1:20, una línea mide 7.5 cm. Medida real (cm).', answer: 150, hint: 'Multiplica por 20.' },
          { q: 'Escala 2:1, una pieza real de 12 mm. ¿Cuánto mide en el dibujo (mm)?', answer: 24, hint: 'Es una ampliación al doble.' },
        ],
      },
      {
        title: 'Vistas ortogonales e isométrico',
        theory: 'La proyección ortogonal representa un objeto con vistas perpendiculares (frontal, superior, lateral…). El isométrico muestra tres caras con ejes a 30° de la horizontal.',
        formula: 'Isométrico: ejes a 120° entre sí (30° con la horizontal)',
        example: { statement: 'Ubica la vista superior en el sistema americano (3er diedro).', steps: ['El observador ve a través del plano de proyección.', 'La vista superior se dibuja arriba de la frontal.'], result: 'Superior arriba de la frontal' },
        exercises: [
          { q: 'Ángulo (°) de los ejes isométricos respecto a la horizontal.', answer: 30, hint: 'Los ejes forman 120° entre sí.' },
          { q: 'En el sistema americano (3er diedro), la vista superior se coloca…', options: ['Arriba de la frontal', 'Debajo de la frontal'], answer: 0, hint: 'En el 3er diedro cada vista se coloca del lado desde el que se observa.' },
        ],
      },
    ],
  },
  {
    id: 'metodologia-etica', name: 'Metodología de la Investigación y Ética Profesional', area: 'administracion', icon: 'Scale', sim: null,
    description: 'Método científico, muestreo, redacción académica y ética del ingeniero.',
    syllabus: ['El método científico', 'Planteamiento del problema', 'Marco teórico', 'Hipótesis y variables', 'Diseño de investigación', 'Muestreo', 'Redacción y citación APA', 'Ética profesional del ingeniero'],
    modules: [
      {
        title: 'Muestreo y variables',
        theory: 'Para estimar una proporción con cierto nivel de confianza y margen de error, se calcula el tamaño de muestra mínimo. La variable independiente es la que se manipula; la dependiente es la que se mide.',
        formula: 'n = Z²·p·q / e²',
        example: { statement: 'Z = 1.96, p = q = 0.5, e = 0.05.', steps: ['n = 3.8416 · 0.25 / 0.0025.', 'n = 384.16 → redondea hacia arriba.'], result: 'n = 385' },
        exercises: [
          { q: 'Z = 1.96, p = q = 0.5, e = 0.1. Tamaño de muestra (redondeado hacia arriba).', answer: 97, hint: 'n = 0.9604/0.01 = 96.04.' },
          { q: 'La variable que el investigador manipula es la…', options: ['Dependiente', 'Independiente', 'Interviniente'], answer: 1, hint: 'Es la causa que se modifica para observar el efecto.' },
        ],
      },
      {
        title: 'Ética profesional del ingeniero',
        theory: 'El ingeniero prioriza la seguridad, la salud y el bienestar público. Debe evitar conflictos de interés, dar crédito a las fuentes y actuar con honestidad técnica, aun bajo presión.',
        formula: 'Seguridad pública > intereses particulares',
        example: { statement: 'Detectas que un diseño aprobado incumple la norma de seguridad.', steps: ['Documenta la falla con evidencia técnica.', 'Informa a tu superior y al cliente.', 'Si persiste el riesgo, escala a la autoridad competente.'], result: 'Actuar y reportar' },
        exercises: [
          { q: 'Copiar un párrafo de un artículo sin citarlo es…', options: ['Paráfrasis válida', 'Plagio', 'Uso justo'], answer: 1, hint: 'Todo texto ajeno requiere cita y referencia.' },
          { q: 'Un proveedor te ofrece un regalo costoso mientras evalúas su propuesta. Lo correcto es…', options: ['Aceptarlo en privado', 'Rechazarlo y declararlo', 'Aceptarlo si la propuesta es buena'], answer: 1, hint: 'Piensa en el conflicto de interés.' },
        ],
      },
    ],
  },
];