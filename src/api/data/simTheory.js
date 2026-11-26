export const THEORY = {
  engine3d: {
    title: 'Motor 4 tiempos · Mecanismo biela-manivela-pistón',
    intro:
      'El pistón convierte la presión del gas en movimiento lineal alternativo; la biela y el cigüeñal lo transforman en rotación. La geometría del mecanismo fija la posición, velocidad y aceleración del pistón para cada ángulo de manivela $\\theta$, y de ahí salen el par motor y las fuerzas de inercia.',
    laws: [
      { name: 'Posición del pistón', tex: 'x(\\theta) = r\\cos\\theta + \\sqrt{L^2 - r^2\\sin^2\\theta}' },
      { name: 'Velocidad del pistón', tex: 'v \\approx r\\omega\\left(\\sin\\theta + \\tfrac{r}{2L}\\sin 2\\theta\\right)' },
      { name: 'Aceleración del pistón', tex: 'a \\approx r\\omega^2\\left(\\cos\\theta + \\tfrac{r}{L}\\cos 2\\theta\\right)' },
      { name: 'Torque en el cigüeñal', tex: 'T = F_{biela}\\, r\\, \\sin(\\theta + \\varphi)' },
      { name: 'Ángulo de la biela', tex: '\\sin\\varphi = \\dfrac{r\\sin\\theta}{L}' },
      { name: 'Fuerza de inercia', tex: 'F_{in} = m_p\\, a' },
    ],
    vars: [
      { sym: 'r', desc: 'Radio de manivela = carrera / 2' },
      { sym: 'L', desc: 'Longitud de la biela' },
      { sym: '\\omega', desc: 'Velocidad angular: $\\omega = 2\\pi \\cdot \\text{RPM}/60$' },
      { sym: '\\varphi', desc: 'Inclinación de la biela respecto al eje del cilindro' },
      { sym: 'm_p', desc: 'Masa equivalente del pistón (0.35 kg)' },
    ],
    notes: [
      'La carrera total del pistón es el doble del radio de manivela: $x_{max} - x_{min} = 2r$.',
      'El par motor varía con $\\theta$: el término $r/L$ genera la segunda armónica que causa vibración.',
      'El contrapeso del cigüeñal compensa la fuerza de inercia $F_{in}$ del pistón.',
    ],
  },
  gears3d: {
    title: 'Trenes de engranes · Transmisión mecánica',
    intro:
      'Dos engranes engranan en sus círculos primitivos: la velocidad tangencial en el punto de contacto es la misma para ambos. Al cambiar el número de dientes cambias la relación de transmisión: pierdes velocidad, ganas torque (o al revés), conservando potencia.',
    laws: [
      { name: 'Relación de transmisión', tex: 'i = \\dfrac{\\omega_1}{\\omega_2} = \\dfrac{Z_2}{Z_1}' },
      { name: 'Conservación de potencia (ideal)', tex: 'T_1\\omega_1 = T_2\\omega_2' },
      { name: 'Torque de salida', tex: 'T_2 = T_1\\,\\dfrac{Z_2}{Z_1}' },
      { name: 'Velocidad tangencial', tex: 'v_t = \\omega_1 r_{p1} = \\omega_2 r_{p2}' },
      { name: 'Módulo del dentado', tex: 'm = \\dfrac{p}{\\pi} = \\dfrac{2\\,r_p}{Z}' },
      { name: 'Fuerza en el diente', tex: 'F \\approx \\dfrac{T_1}{r_{p1}}' },
    ],
    vars: [
      { sym: 'Z_1, Z_2', desc: 'Número de dientes del engrane motriz y conducido' },
      { sym: 'm', desc: 'Módulo (define el tamaño del diente, en mm)' },
      { sym: 'r_p', desc: 'Radio primitivo: $r_p = mZ/2$' },
      { sym: '\\omega', desc: 'Velocidad angular (RPM)' },
      { sym: 'T', desc: 'Torque transmitido (N·m)' },
    ],
    notes: [
      'Los dos engranes giran en sentidos opuestos: observa las flechas en la simulación.',
      'Para engranar correctamente, dos engranes deben tener el mismo módulo $m$.',
      'La esfera ámbar marca la zona de contacto: ahí se concentra el desgaste y el estrés de flexión del diente.',
    ],
  },
  truss3d: {
    title: 'Armaduras (cerchas) · Esfuerzos y mapa de Von Mises',
    intro:
      'Una armadura es una estructura de miembros rectos unidos por nodos articulados. Cada miembro trabaja únicamente a fuerza axial (tensión o compresión). Al aplicar una carga, el método de los nodos resuelve todas las fuerzas internas y el mapa de calor muestra dónde se concentra el esfuerzo.',
    laws: [
      { name: 'Equilibrio en cada nodo', tex: '\\sum F_x = 0, \\qquad \\sum F_y = 0' },
      { name: 'Esfuerzo axial', tex: '\\sigma = \\dfrac{|N|}{A}' },
      { name: 'Criterio de Von Mises (axial)', tex: '\\sigma_{vm} = \\sqrt{\\sigma^2} = \\dfrac{|N|}{A}' },
      { name: 'Deformación (Ley de Hooke)', tex: '\\varepsilon = \\dfrac{\\sigma}{E}, \\qquad \\delta = \\dfrac{N\\,L}{E\\,A}' },
      { name: 'Estática determinada', tex: 'm + r = 2j' },
    ],
    vars: [
      { sym: 'N', desc: 'Fuerza axial del miembro (+ tensión, − compresión)' },
      { sym: 'A', desc: 'Área de sección transversal: $1\\times10^{-3}\\ \\text{m}^2$' },
      { sym: 'E', desc: 'Módulo de Young del material' },
      { sym: 'm, r, j', desc: 'Miembros, reacciones y nodos de la armadura' },
    ],
    notes: [
      'Con $A = 10^{-3}\\ \\text{m}^2$, cada kN equivale exactamente a 1 MPa de esfuerzo.',
      'Los cordones superiores suelen trabajar a compresión; los inferiores, a tensión.',
      'Si $m + r = 2j$ la armadura es estáticamente determinada: el método de nodos basta.',
    ],
  },
  vector3d: {
    title: 'Espacios vectoriales en $\\mathbb{R}^3$',
    intro:
      'Cada vector en el espacio tiene dirección, sentido y magnitud. El producto punto mide proyección (escalar); el producto cruz genera un vector perpendicular a ambos, fundamental para momentos, áreas y campos magnéticos.',
    laws: [
      { name: 'Magnitud', tex: '|\\vec{A}| = \\sqrt{A_x^2 + A_y^2 + A_z^2}' },
      { name: 'Producto punto', tex: '\\vec{A}\\cdot\\vec{B} = |\\vec{A}||\\vec{B}|\\cos\\theta = A_xB_x + A_yB_y + A_zB_z' },
      { name: 'Producto cruz', tex: '\\vec{A}\\times\\vec{B} = |\\vec{A}||\\vec{B}|\\sin\\theta\\,\\hat{n}' },
      { name: 'Coseno directriz', tex: '\\cos\\theta = \\dfrac{\\vec{A}\\cdot\\vec{B}}{|\\vec{A}||\\vec{B}|}' },
    ],
    vars: [
      { sym: '\\hat{n}', desc: 'Vector unitario dado por la regla de la mano derecha' },
      { sym: '\\theta', desc: 'Ángulo entre $\\vec{A}$ y $\\vec{B}$' },
    ],
    notes: [
      'Si $\\vec{A}\\cdot\\vec{B} = 0$, los vectores son perpendiculares.',
      'Si $\\vec{A}\\times\\vec{B} = \\vec{0}$, los vectores son paralelos.',
      'El producto cruz NO es conmutativo: $\\vec{A}\\times\\vec{B} = -\\vec{B}\\times\\vec{A}$.',
    ],
  },
  rotation: {
    title: 'Cinemática rotacional',
    intro:
      'Un cuerpo rígido que rota comparte la misma velocidad angular $\\omega$, pero cada punto tiene velocidad lineal proporcional a su radio. La aceleración tiene dos componentes: tangencial (cambio de rapidez) y centrípeta (cambio de dirección).',
    laws: [
      { name: 'Velocidad lineal', tex: 'v = \\omega\\, r' },
      { name: 'Aceleración centrípeta', tex: 'a_c = \\omega^2 r = \\dfrac{v^2}{r}' },
      { name: 'Aceleración tangencial', tex: 'a_t = \\alpha\\, r' },
      { name: 'Analogía lineal-rotacional', tex: 'F = ma \\;\\Longleftrightarrow\\; \\tau = I\\alpha' },
    ],
    vars: [
      { sym: '\\omega', desc: 'Velocidad angular (rad/s)' },
      { sym: '\\alpha', desc: 'Aceleración angular (rad/s²)' },
      { sym: 'I', desc: 'Momento de inercia' },
    ],
    notes: ['Todos los puntos comparten $\\omega$ y $\\alpha$, pero no la velocidad lineal.', 'La aceleración centrípeta siempre apunta al eje de rotación.'],
  },
  grapher: {
    title: 'Graficador dinámico · Derivadas y tangentes',
    intro:
      'La derivada en un punto es la pendiente de la recta tangente: mide la razón de cambio instantánea. Al mover el punto de análisis, la tangente se recalcula en tiempo real.',
    laws: [
      { name: 'Definición de derivada', tex: "f'(x) = \\lim_{h \\to 0}\\dfrac{f(x+h) - f(x)}{h}" },
      { name: 'Recta tangente', tex: 'y = f(a) + f\'(a)(x - a)' },
      { name: 'Regla de la cadena', tex: "\\dfrac{d}{dx}f(g(x)) = f'(g(x))\\,g'(x)" },
      { name: 'Regla del producto', tex: "(fg)' = f'g + fg'" },
    ],
    vars: [
      { sym: "f'(a)", desc: 'Pendiente de la tangente en $x = a$' },
      { sym: 'h', desc: 'Incremento que tiende a cero' },
    ],
    notes: ['$f\'(x) > 0$: función creciente; $f\'(x) < 0$: decreciente.', 'En máximos y mínimos, $f\'(x) = 0$.'],
  },
  riemann: {
    title: 'Sumas de Riemann · Integral definida',
    intro:
      'El área bajo una curva se aproxima con rectángulos. Al hacerlos más delgados, la suma converge al valor exacto de la integral definida: esa es la idea central del Cálculo Integral.',
    laws: [
      { name: 'Suma de Riemann', tex: '\\int_a^b f(x)\\,dx \\approx \\sum_{i=1}^{n} f(x_i)\\,\\Delta x' },
      { name: 'Definición formal', tex: '\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty}\\sum_{i=1}^{n} f(x_i)\\,\\Delta x' },
      { name: 'Teorema fundamental', tex: '\\int_a^b f(x)\\,dx = F(b) - F(a)' },
    ],
    vars: [
      { sym: '\\Delta x', desc: 'Ancho de cada rectángulo: $(b-a)/n$' },
      { sym: 'n', desc: 'Número de rectángulos' },
    ],
    notes: ['Los rectángulos pueden tomar $f$ en el extremo izquierdo, derecho o punto medio.', 'Con $f \\geq 0$, la integral representa área; con signo mixto, área con signo.'],
  },
  oscillator: {
    title: 'Oscilador amortiguado · Resorte-masa',
    intro:
      'Un sistema masa-resorte-amortiguador describe vibraciones en ingeniería: desde un chasis de auto hasta un edificio ante un sismo. El amortiguamiento determina si el sistema regresa al equilibrio oscilando o sin oscilar.',
    laws: [
      { name: 'Ecuación de movimiento', tex: 'm\\ddot{x} + c\\dot{x} + kx = F_0\\cos(\\omega t)' },
      { name: 'Frecuencia natural', tex: '\\omega_n = \\sqrt{\\dfrac{k}{m}}' },
      { name: 'Razón de amortiguamiento', tex: '\\zeta = \\dfrac{c}{2\\sqrt{km}}' },
      { name: 'Casos', tex: '\\zeta < 1 \\text{ subamortiguado}, \\quad \\zeta = 1 \\text{ crítico}' },
    ],
    vars: [
      { sym: 'm', desc: 'Masa del bloque' },
      { sym: 'k', desc: 'Constante del resorte' },
      { sym: 'c', desc: 'Coeficiente de amortiguamiento' },
    ],
    notes: ['En resonancia ($\\omega \\approx \\omega_n$) la amplitud se dispara si el amortiguamiento es bajo.', 'El amortiguamiento crítico regresa al equilibrio sin oscilar.'],
  },
  network: {
    title: 'Redes de flujo y programación lineal',
    intro:
      'Investigación de Operaciones optimiza recursos: el algoritmo de Ford-Fulkerson encuentra el flujo máximo de una red con capacidades; el método Simplex optimiza una función lineal sujeta a restricciones.',
    laws: [
      { name: 'Conservación de flujo', tex: '\\sum_{e \\in \\delta^+(v)} f(e) - \\sum_{e \\in \\delta^-(v)} f(e) = 0' },
      { name: 'Restricción de capacidad', tex: '0 \\leq f(e) \\leq c(e)' },
      { name: 'Máx-flujo / min-corte', tex: '\\max |f| = \\min_{S} c(\\delta^+(S))' },
      { name: 'Problema Simplex', tex: '\\max\\, c^Tx \\;\\text{s.t.}\\; Ax \\leq b,\\; x \\geq 0' },
    ],
    vars: [
      { sym: 'f(e)', desc: 'Flujo por la arista $e$' },
      { sym: 'c(e)', desc: 'Capacidad máxima de $e$' },
      { sym: '\\delta(S)', desc: 'Corte que separa fuente y sumidero' },
    ],
    notes: ['El flujo máximo equivale siempre al corte mínimo de la red.', 'El Simplex recorre vértices del poliedro factible hacia el óptimo.'],
  },
};