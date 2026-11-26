// Profe Bot simulado: tutor socrático sin IA, para el modo invitado y cuando el
// servidor no tiene AI_API_KEY. Sigue las reglas del prompt real: nunca da la
// solución ni confirma resultados, responde con 1-2 preguntas o una micro-pista.
//
// ponytail: reglas por palabras clave; cambia a la IA real configurando AI_API_KEY en el servidor.
import { normalize } from './check';

// Cada tema escala en 3 pasos: ubicar el concepto → plantear → micro-pista.
// El orden importa: gana el primero que coincida ("antiderivada" debe caer en integral, no en derivada).
const TOPICS = [
  { id: 'integral', keys: /integr|antideriv|area bajo|riemann|por partes|sustitucion|∫/, steps: [
    '¿Ves una función y (casi) su derivada multiplicándose? Eso sugiere sustitución. ¿Y si son de distinto tipo?',
    'Si es por partes, ¿cuál eliges como u para que su derivada se simplifique? (piensa en LIATE)',
    'Para una definida: ¿ya tienes la antiderivada? Evalúa en el límite superior y resta el inferior.',
  ] },
  { id: 'limite', keys: /\blimite|lim\b|indetermin|tiende a|0\/0/, steps: [
    '¿Qué obtienes si sustituyes el valor directamente? Si sale 0/0, ¿qué te dice eso?',
    'Ante un 0/0, ¿puedes factorizar el numerador o el denominador para cancelar algo?',
    'Busca un factor común como (x − a): diferencia de cuadrados o trinomio. ¿Cuál aparece aquí?',
  ] },
  { id: 'derivada', keys: /deriv|pendiente|recta tangente|razon de cambio|f'|f′|optimiz|maximo|minimo|critico/, steps: [
    '¿Qué representa la derivada en este problema: una pendiente, una velocidad o algo que quieres maximizar?',
    '¿Qué regla aplica: potencia, producto, cociente o cadena? Fíjate si hay una función dentro de otra.',
    'Si buscas máximos o mínimos, ¿qué valor debe tomar la derivada en esos puntos?',
  ] },
  { id: 'algebra-lineal', keys: /matriz|determinante|vector propio|eigen|sistema de ecuaciones|gauss|inversa|rango/, steps: [
    '¿Qué te piden exactamente: resolver el sistema, el determinante o los valores propios?',
    'Para un determinante 2×2, ¿qué productos cruzados intervienen y en qué orden se restan?',
    'Si escalonas con Gauss, ¿qué operación de renglón deja un cero debajo del primer pivote?',
  ] },
  { id: 'vectores', keys: /vector|producto punto|producto cruz|a·b|a×b|magnitud|angulo entre/, steps: [
    '¿Necesitas un escalar o un vector como resultado? Eso decide entre producto punto y cruz.',
    'El producto punto suma productos componente a componente. ¿Cuáles componentes multiplicas?',
    'Para el ángulo: ¿cómo despejas cos θ de A·B = |A||B| cos θ?',
  ] },
  { id: 'ecuaciones-dif', keys: /ecuacion diferencial|edo|masa.?resorte|oscila|omega|ω|amortigu|separacion de variables/, steps: [
    '¿Es de primer o de segundo orden? ¿Puedes separar las variables?',
    'En un masa-resorte, ¿qué dos cantidades determinan la frecuencia natural?',
    'Recuerda la forma m·x″ + k·x = 0: ¿qué relación entre k y m aparece dentro de la raíz?',
  ] },
  { id: 'dinamica', keys: /fuerza|newton|friccion|rozamiento|cuerpo libre|dcl|aceleracion|plano inclinado|tension|μ|mu\b/, steps: [
    '¿Ya dibujaste el diagrama de cuerpo libre? ¿Qué fuerzas actúan sobre el cuerpo?',
    '¿Qué eje elegiste? Escribe ΣF = m·a en ese eje: ¿qué fuerzas van a favor y cuáles en contra?',
    'La fricción cinética vale μ·N. ¿Cuánto vale la normal N en tu caso?',
  ] },
  { id: 'rotacion', keys: /rpm|gira|rotacion|velocidad (tangencial|angular)|rad\/s|radian|centripet|circular/, steps: [
    '¿Te dan la rapidez en RPM? Antes de cualquier fórmula, ¿cómo la pasas a rad/s?',
    '¿Qué relación conecta la velocidad angular ω con la velocidad tangencial en el borde?',
    'Una vuelta son 2π radianes y un minuto son 60 s. ¿Qué factor te queda para convertir RPM a rad/s?',
  ] },
  { id: 'energia', keys: /energia|trabajo|potencia|cinetica|potencial|conservacion/, steps: [
    '¿Se conserva la energía o hay fricción quitándola? Eso cambia todo el planteamiento.',
    '¿Qué tipos de energía hay al inicio y cuáles al final?',
    'Iguala la energía inicial con la final (más las pérdidas). ¿Qué incógnita queda sola?',
  ] },
  { id: 'circuitos', keys: /circuito|resistencia|capacitor|rc\b|ohm|voltaje|corriente|kirchhoff/, steps: [
    '¿Las resistencias están en serie o en paralelo? ¿Cómo lo sabes?',
    '¿Qué ley conecta voltaje, corriente y resistencia? ¿Cuál de las tres te falta?',
    'En un RC, la constante de tiempo es el producto de dos valores. ¿Cuidaste las unidades (μF → F)?',
  ] },
  { id: 'termo', keys: /termodinam|carnot|eficiencia|calor|entropia|ciclo|kelvin/, steps: [
    '¿Tus temperaturas están en kelvin? Es lo primero que revisa cualquier profe de termo.',
    '¿Cuál es el depósito caliente y cuál el frío? La eficiencia depende de su cociente.',
    'La eficiencia de Carnot es 1 menos un cociente de temperaturas. ¿Cuál va arriba?',
  ] },
  { id: 'gases', keys: /gas ideal|pv\s?=|presion|moles|volumen|constante r\b/, steps: [
    '¿Qué ecuación relaciona presión, volumen, moles y temperatura?',
    '¿Qué valor de R usas? Depende de las unidades de presión y volumen que manejes.',
    'Despeja la incógnita antes de sustituir números. ¿Qué queda del otro lado?',
  ] },
  { id: 'estructuras', keys: /armadura|estatica|momento|torque|nodo|reaccion|apoyo|viga|esfuerzo|deforma/, steps: [
    '¿Ya hiciste el equilibrio global? ΣFx = 0, ΣFy = 0 y ΣM = 0 te dan las reacciones.',
    '¿Respecto a qué punto tomas momentos? Elige uno donde se cancelen varias incógnitas.',
    'Por el método de nodos, empieza en un nodo con máximo dos barras desconocidas. ¿Cuál cumple?',
  ] },
  { id: 'simplex', keys: /simplex|programacion lineal|pivote|holgura|funcion objetivo|flujo maximo|investigacion de operaciones/, steps: [
    '¿Cuál es tu función objetivo y cuáles son las restricciones? Escríbelas antes de la tabla.',
    'En la tabla, ¿qué columna entra? Busca el coeficiente más negativo del renglón Z.',
    'Para la fila que sale, usa la razón mínima positiva: lado derecho entre la columna pivote.',
  ] },
  { id: 'probabilidad', keys: /probabilidad|binomial|normal|media|varianza|desviacion|distribucion|p\(x/, steps: [
    '¿Los eventos son independientes? ¿Hay un número fijo de intentos con éxito o fracaso?',
    'Si es binomial, ¿qué valen n, p y k en tu problema?',
    'P(X = 0) significa cero éxitos: ¿cuál es la probabilidad de fallar en todos los intentos?',
  ] },
  { id: 'economia', keys: /interes|valor presente|valor futuro|tasa|anualidad|depreciacion|costo/, steps: [
    '¿El interés es simple o compuesto? ¿Cada cuánto se capitaliza?',
    '¿Te piden llevar el dinero al futuro o traerlo al presente?',
    'En interés compuesto el factor es (1 + i) elevado a algo. ¿A qué?',
  ] },
  { id: 'programacion', keys: /codigo|programa|bucle|ciclo for|while|arreglo|funcion recursiva|algoritmo|python|c\+\+/, steps: [
    '¿Qué entrada recibe tu programa y qué salida esperas? Escribe un ejemplo pequeño a mano.',
    'Sigue tu código línea por línea con ese ejemplo: ¿en qué paso deja de hacer lo que esperas?',
    'Revisa la condición de paro de tu ciclo: ¿se cumple alguna vez?',
  ] },
  { id: 'despeje', keys: /despej|ecuacion|incognita|resolver para|aislar/, steps: [
    '¿Qué operación está "pegada" a la x? Para quitarla, aplica la operación inversa en ambos lados.',
    '¿Hay x en más de un término? Júntalos de un solo lado antes de despejar.',
    'Si x está dentro de una raíz o potencia, ¿qué operación la deshace?',
  ] },
];

const GREETING = /^(hola|buenas|buen dia|buenos dias|buenas tardes|hey|que tal)\b/;
const WANTS_ANSWER = /dame la (respuesta|solucion)|cual es (la respuesta|el resultado)|resuelvel|resuelve(lo|me)|hazlo tu|nomas dime|solo dime/;
const FRUSTRATED = /no entiendo nada|estoy perdid|no se nada|ayuda+$|me rindo|no le entiendo/;
// "me dio 3.2" es un resultado; "me sale 0/0" es una forma indeterminada, no un resultado.
const CLAIMS_RESULT = /(me (dio|da|sale|salio)|obtuve|puse|resultado es|es igual a)\s*[-−]?\d+([.,]\d+)?(?!\s*\/)/;

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = (arr, seed) => arr[seed % arr.length];

const findTopic = (text) => TOPICS.find((t) => t.keys.test(text));

/**
 * @param {{ question: string, context?: string, history?: string[] }} input
 * history: líneas "Alumno: …" / "Profe Bot: …" como las arma ProfeBot.jsx.
 */
export function simulateProfeBot({ question, context = '', history = [] }) {
  const q = normalize(question);
  const seed = hash(q);
  const past = normalize(history.join(' '));
  const hint = /PISTA:\s*([^·]+)/.exec(context)?.[1]?.trim();

  if (WANTS_ANSWER.test(q)) {
    return pick([
      'Si te la doy, en el examen no vas a estar tú. Mejor dime: ¿qué dato del problema todavía no has usado?',
      'La respuesta no, pero sí el camino: ¿qué te piden encontrar y qué fórmula conecta eso con tus datos?',
      'Trato hecho a medias: tú haces el primer paso y yo te digo si vas por buen camino. ¿Cuál sería?',
    ], seed);
  }
  // Si ya sabe que está mal ("me equivoqué", "no sale"), verificar su número no ayuda: mejor guiar por el tema.
  const knownWrong = /me equivoque|no (me )?sale/.test(q);
  if (CLAIMS_RESULT.test(q) && !knownWrong) {
    return pick([
      'No te confirmo números, pero sí te enseño a verificar: ¿las unidades te cuadran? ¿El orden de magnitud tiene sentido?',
      'Sustituye tu resultado de vuelta en el planteamiento original. ¿Se cumple la igualdad?',
      'Buen intento. ¿Qué pasaría con tu resultado si un dato fuera el doble? ¿Se comporta como esperarías?',
    ], seed);
  }
  if (FRUSTRATED.test(q)) {
    return 'Tranqui, pasa en todas las materias de tronco común. Vamos por partes: ¿qué te pide el problema, en una sola frase?';
  }
  if (GREETING.test(q) && q.length < 25) {
    return '¡Hola! Soy Profe Bot. Cuéntame el problema o pega el enunciado: no te daré la respuesta, pero te hago las preguntas correctas.';
  }

  const topic = findTopic(q) || findTopic(normalize(context)) || findTopic(past);
  if (!topic) {
    return pick([
      '¿Qué datos te da el problema y qué te piden? Escríbelos como lista y vemos qué los conecta.',
      '¿De qué materia es y qué tema están viendo en clase? Así te guío mejor.',
      'Antes de las fórmulas: ¿puedes explicar el problema con tus propias palabras, como si se lo contaras a un amigo?',
    ], seed);
  }

  // Cada respuesta previa de Profe Bot sube un paso: concepto → planteamiento → micro-pista.
  const stage = history.filter((h) => h.startsWith('Profe Bot')).length;
  if (stage < topic.steps.length) return topic.steps[stage];
  if (hint) return `Micro-pista: ${hint} ¿Qué paso sigue con eso?`;
  return 'Este paso se está atorando. Abre el ejemplo resuelto del módulo y dime en qué renglón te pierdes: de ahí seguimos.';
}
