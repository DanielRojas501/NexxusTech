export const SCIENCE_SUBJECTS = [
  {
    id: 'fisica-dinamica', name: 'Física General / Dinámica', area: 'fisica', icon: 'Orbit', sim: 'rotation',
    description: 'Cinemática, leyes de Newton, velocidad y aceleración angular, momentos de inercia.',
    syllabus: ['Cinemática lineal', 'Movimiento de proyectiles', 'Leyes de Newton', 'Trabajo y energía', 'Cantidad de movimiento', 'Cinemática rotacional', 'Dinámica rotacional', 'Momento de inercia'],
    modules: [
      {
        title: 'Cinemática rotacional',
        theory: 'Un cuerpo que gira tiene velocidad angular ω (rad/s). Cada punto a distancia r del eje se mueve con velocidad tangencial v = ωr y experimenta una aceleración centrípeta dirigida al centro. Si hay aceleración angular α, ω cambia linealmente.',
        formula: 'ω = 2π·RPM/60     v = ω·r     a꜀ = ω²·r',
        example: { statement: 'Hélice de r = 0.5 m a 180 RPM.', steps: ['ω = 2π(180)/60 = 18.85 rad/s.', 'v = 18.85 · 0.5 = 9.42 m/s.', 'a꜀ = 18.85² · 0.5 = 177.7 m/s².'], result: 'v = 9.42 m/s, a꜀ = 177.7 m/s²' },
        exercises: [
          { q: 'Convierte 600 RPM a rad/s.', answer: 62.832, hint: 'Multiplica por 2π y divide entre 60.' },
          { q: 'ω₀ = 18.85 rad/s y α = 3 rad/s². ¿ω después de 4 s?', answer: 30.85, hint: 'ω = ω₀ + α·t.' },
        ],
      },
      {
        title: 'Leyes de Newton y momento de inercia',
        theory: 'La segunda ley relaciona la fuerza neta con la aceleración. En rotación, el torque neto produce aceleración angular: τ = Iα, donde I (momento de inercia) mide la resistencia a girar.',
        formula: 'ΣF = m·a     τ = I·α     I(disco) = ½mr²',
        example: { statement: 'Bloque de 10 kg jalado con 50 N, μk = 0.2.', steps: ['Fricción: 0.2 · 10 · 9.81 = 19.62 N.', 'Fuerza neta: 50 − 19.62 = 30.38 N.', 'a = 30.38/10.'], result: 'a = 3.04 m/s²' },
        exercises: [
          { q: 'F = 30 N sobre m = 6 kg sin fricción. Calcula a (m/s²).', answer: 5, hint: 'a = F/m.' },
          { q: 'Momento de inercia de un disco de 4 kg y r = 0.5 m (kg·m²).', answer: 0.5, hint: 'I = ½·m·r².' },
        ],
      },
    ],
  },
  {
    id: 'electricidad-magnetismo', name: 'Electricidad y Magnetismo', area: 'fisica', icon: 'Zap', sim: null,
    description: 'Campos eléctricos, ley de Gauss, potencial y circuitos RC, RL y RLC.',
    syllabus: ['Carga y ley de Coulomb', 'Campo eléctrico', 'Ley de Gauss', 'Potencial eléctrico', 'Capacitancia', 'Circuitos de corriente directa', 'Campo magnético', 'Circuitos RC, RL y RLC'],
    modules: [
      {
        title: 'Ley de Coulomb, campo y Gauss',
        theory: 'Dos cargas se atraen o repelen con una fuerza proporcional al producto de las cargas e inversamente proporcional al cuadrado de la distancia. La ley de Gauss relaciona el flujo eléctrico a través de una superficie cerrada con la carga encerrada.',
        formula: 'F = k|q₁q₂|/r²     E = kq/r²     Φ = q/ε₀',
        example: { statement: 'q₁ = q₂ = 2 μC separadas 0.1 m.', steps: ['k = 8.99×10⁹ N·m²/C².', 'F = 8.99×10⁹ · (4×10⁻¹²) / 0.01.'], result: 'F ≈ 3.60 N' },
        exercises: [
          { q: 'Campo eléctrico (N/C) de 1 nC a 0.3 m.', answer: 99.89, hint: 'E = kq/r² = 8.99×10⁹ · 10⁻⁹ / 0.09.' },
          { q: 'Flujo eléctrico (N·m²/C) por una superficie que encierra 1 μC.', answer: 112940, hint: 'Φ = q/ε₀ con ε₀ = 8.854×10⁻¹².' },
        ],
      },
      {
        title: 'Circuitos RC y RLC',
        theory: 'Un capacitor se carga exponencialmente con constante de tiempo τ = RC: tras 1τ alcanza 63.2 % del voltaje final. En un RLC, la energía oscila entre L y C a la frecuencia de resonancia.',
        formula: 'τ = RC     V(t) = V₀(1 − e^(−t/τ))     f₀ = 1/(2π√(LC))',
        example: { statement: 'R = 10 kΩ, C = 100 μF, V₀ = 12 V. V en t = 1 s.', steps: ['τ = 10⁴ · 10⁻⁴ = 1 s.', 'V = 12(1 − e⁻¹) = 12 · 0.632.'], result: 'V ≈ 7.59 V' },
        exercises: [
          { q: 'Constante de tiempo τ (s) con R = 2000 Ω y C = 500 μF.', answer: 1, hint: 'τ = R·C = 2000 · 0.0005.' },
          { q: 'Frecuencia de resonancia (Hz) con L = 0.1 H, C = 100 μF.', answer: 50.33, hint: 'LC = 10⁻⁵ → √LC ≈ 0.003162.' },
        ],
      },
    ],
  },
  {
    id: 'termodinamica', name: 'Termodinámica', area: 'fisica', icon: 'Flame', sim: null,
    description: 'Leyes termodinámicas, ciclos de potencia y transferencia de calor.',
    syllabus: ['Temperatura y calor', 'Primera ley', 'Gases ideales y procesos', 'Segunda ley', 'Entropía', 'Ciclo de Carnot', 'Ciclos Otto y Rankine', 'Transferencia de calor'],
    modules: [
      {
        title: 'Primera ley y calor sensible',
        theory: 'La energía se conserva: el cambio de energía interna es el calor que entra menos el trabajo que realiza el sistema. El calor sensible cambia la temperatura según la masa y el calor específico.',
        formula: 'ΔU = Q − W     Q = m·c·ΔT',
        example: { statement: 'Un gas recibe 500 J y realiza 200 J de trabajo.', steps: ['ΔU = Q − W.', 'ΔU = 500 − 200.'], result: 'ΔU = 300 J' },
        exercises: [
          { q: 'Q = 1200 J, ΔU = 700 J. ¿Trabajo realizado W (J)?', answer: 500, hint: 'Despeja W = Q − ΔU.' },
          { q: 'Calor (J) para calentar 2 kg de agua 10 °C (c = 4186 J/kg·°C).', answer: 83720, hint: 'Q = m·c·ΔT.' },
        ],
      },
      {
        title: 'Máquinas térmicas y transferencia de calor',
        theory: 'Ninguna máquina supera la eficiencia de Carnot, que depende solo de las temperaturas absolutas de las fuentes. La conducción transfiere calor proporcional al gradiente de temperatura.',
        formula: 'η = 1 − T꜀/Tₕ     q = k·A·ΔT/L',
        example: { statement: 'Carnot entre 600 K y 300 K.', steps: ['η = 1 − 300/600.'], result: 'η = 0.5 (50 %)' },
        exercises: [
          { q: 'Eficiencia de Carnot entre 800 K y 320 K (decimal).', answer: 0.6, hint: 'η = 1 − 320/800.' },
          { q: 'Conducción: k = 0.8, A = 2 m², ΔT = 20 K, L = 0.1 m. q (W)?', answer: 320, hint: 'q = kAΔT/L.' },
        ],
      },
    ],
  },
  {
    id: 'estatica-estructuras', name: 'Estática y Dinámica de Estructuras', area: 'fisica', icon: 'Building2', sim: 'truss3d',
    description: 'Equilibrio de cuerpo rígido, diagramas de cuerpo libre y análisis de armaduras.',
    syllabus: ['Fuerzas y vectores', 'Equilibrio de la partícula', 'Momento de una fuerza', 'Equilibrio de cuerpo rígido', 'Diagramas de cuerpo libre', 'Armaduras: método de nodos', 'Armaduras: método de secciones', 'Centroides y fricción'],
    modules: [
      {
        title: 'Momento y equilibrio de cuerpo rígido',
        theory: 'Un cuerpo rígido está en equilibrio si la suma de fuerzas y la suma de momentos son cero. Tomar momentos en un apoyo elimina esa reacción de la ecuación.',
        formula: 'ΣFx = 0     ΣFy = 0     ΣM = 0',
        example: { statement: 'Viga de 6 m simplemente apoyada con 1200 N a 2 m de A.', steps: ['ΣM_A = 0: R_B·6 − 1200·2 = 0 → R_B = 400 N.', 'ΣFy = 0: R_A + 400 = 1200.'], result: 'R_A = 800 N, R_B = 400 N' },
        exercises: [
          { q: 'Momento (N·m) de una fuerza de 50 N a 0.4 m del eje (perpendicular).', answer: 20, hint: 'M = F·d.' },
          { q: 'Viga de 10 m con 1000 N al centro. Reacción R_A (N).', answer: 500, hint: 'Por simetría, cada apoyo toma la mitad.' },
        ],
      },
      {
        title: 'Armaduras: método de nodos',
        theory: 'Cada nodo de una armadura es una partícula en equilibrio. Planteas ΣFx = 0 y ΣFy = 0 en cada nodo. Si la barra jala al nodo está en tensión; si lo empuja, en compresión.',
        formula: 'En cada nodo: ΣFx = 0, ΣFy = 0',
        example: { statement: 'Nodo con dos barras simétricas a 45° sosteniendo 1000 N.', steps: ['ΣFy: 2F·sin 45° = 1000.', 'F = 1000/(2 · 0.7071).'], result: 'F ≈ 707.1 N (compresión)' },
        exercises: [
          { q: 'Dos barras simétricas a 30° de la horizontal sostienen 500 N. Fuerza en cada barra (N).', answer: 500, hint: '2F·sin 30° = 500 y sin 30° = 0.5.' },
          { q: 'Una barra que "jala" al nodo está en…', options: ['Tensión', 'Compresión'], answer: 0, hint: 'Si la barra tira del nodo hacia ella, se está estirando.' },
        ],
      },
    ],
  },
  {
    id: 'quimica-general', name: 'Química General', area: 'quimica', icon: 'FlaskConical', sim: null,
    description: 'Estequiometría, gases ideales, enlaces químicos y soluciones.',
    syllabus: ['Materia y medición', 'Estructura atómica', 'Tabla periódica', 'Enlaces químicos', 'Mol y masa molar', 'Estequiometría', 'Gases ideales', 'Soluciones'],
    modules: [
      {
        title: 'Mol y estequiometría',
        theory: 'El mol conecta masa con número de partículas. Una ecuación balanceada da las proporciones molares entre reactivos y productos: convierte gramos → moles → moles del producto → gramos.',
        formula: 'n = m / M',
        example: { statement: '2H₂ + O₂ → 2H₂O. ¿Gramos de agua a partir de 4 g de H₂?', steps: ['n(H₂) = 4/2 = 2 mol.', 'Relación 2:2 → 2 mol de H₂O.', 'm = 2 · 18 g/mol.'], result: '36 g de H₂O' },
        exercises: [
          { q: '¿Cuántos moles hay en 88 g de CO₂ (M = 44 g/mol)?', answer: 2, hint: 'n = m/M.' },
          { q: 'Gramos de agua a partir de 8 g de H₂ (con O₂ en exceso).', answer: 72, hint: '8 g de H₂ = 4 mol → 4 mol de H₂O × 18 g/mol.' },
        ],
      },
      {
        title: 'Gases ideales y enlaces',
        theory: 'Los gases ideales relacionan presión, volumen, moles y temperatura absoluta. El tipo de enlace depende de la diferencia de electronegatividad: iónico (metal + no metal), covalente (no metales).',
        formula: 'PV = nRT     R = 0.08206 L·atm/(mol·K)',
        example: { statement: 'Volumen de 1 mol a 273.15 K y 1 atm.', steps: ['V = nRT/P.', 'V = 1 · 0.08206 · 273.15 / 1.'], result: 'V ≈ 22.41 L' },
        exercises: [
          { q: 'n = 2 mol, T = 300 K, V = 10 L. Presión (atm).', answer: 4.924, hint: 'P = nRT/V.' },
          { q: '¿Qué tipo de enlace tiene el NaCl?', options: ['Iónico', 'Covalente polar', 'Metálico'], answer: 0, hint: 'Metal (Na) + no metal (Cl) con gran diferencia de electronegatividad.' },
        ],
      },
    ],
  },
  {
    id: 'propiedades-materiales', name: 'Propiedades de los Materiales', area: 'quimica', icon: 'Atom', sim: null,
    description: 'Estructuras cristalinas, ensayos mecánicos y diagramas de fase.',
    syllabus: ['Estructura atómica y enlaces', 'Estructuras cristalinas', 'Índices de Miller', 'Defectos cristalinos', 'Ensayo de tensión', 'Dureza e impacto', 'Diagramas de fase', 'Tratamientos térmicos'],
    modules: [
      {
        title: 'Estructuras cristalinas',
        theory: 'Los metales cristalizan en redes como FCC (4 átomos/celda, APF 0.74) o BCC (2 átomos/celda, APF 0.68). El parámetro de red a se relaciona con el radio atómico R.',
        formula: 'FCC: a = 2√2·R     BCC: a = 4R/√3',
        example: { statement: 'Cobre FCC con R = 0.128 nm.', steps: ['a = 2√2 · 0.128.', 'a = 2.828 · 0.128.'], result: 'a ≈ 0.362 nm' },
        exercises: [
          { q: '¿Cuántos átomos tiene una celda FCC?', answer: 4, hint: '8 esquinas × 1/8 + 6 caras × 1/2.' },
          { q: 'Hierro BCC con R = 0.124 nm. Parámetro a (nm).', answer: 0.2864, hint: 'a = 4R/√3.' },
        ],
      },
      {
        title: 'Ensayo de tensión',
        theory: 'El esfuerzo es fuerza por unidad de área; la deformación unitaria es el cambio relativo de longitud. En la zona elástica se cumple la ley de Hooke, y la pendiente es el módulo de Young.',
        formula: 'σ = F/A     ε = ΔL/L₀     E = σ/ε',
        example: { statement: 'F = 20 000 N, A = 100 mm², ε = 0.001.', steps: ['σ = 20 000/100 = 200 MPa.', 'E = 200/0.001 = 200 000 MPa.'], result: 'E = 200 GPa' },
        exercises: [
          { q: 'F = 9000 N sobre A = 30 mm². Esfuerzo (MPa).', answer: 300, hint: 'N/mm² = MPa.' },
          { q: 'ΔL = 0.5 mm, L₀ = 100 mm. Deformación unitaria ε.', answer: 0.005, hint: 'ε = ΔL/L₀.' },
        ],
      },
    ],
  },
];