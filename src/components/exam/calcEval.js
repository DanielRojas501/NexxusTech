const ALLOWED = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'log', 'log10', 'PI', 'E', 'abs'];

export function evaluate(expr) {
  let s = expr
    .replace(/π/g, 'PI')
    .replace(/√/g, 'sqrt')
    .replace(/\^/g, '**')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\blog\(/g, 'log10(')
    .replace(/\bln\(/g, 'log(')
    .replace(/\be\b/g, 'E');
  if (!/^[0-9+\-*/().\s,a-zA-Z]*$/.test(s)) throw new Error('bad');
  const ids = s.match(/[a-zA-Z]+\d*/g) || [];
  if (ids.some((id) => !ALLOWED.includes(id))) throw new Error('bad');
  s = s.replace(/[a-zA-Z]+\d*/g, (id) => `Math.${id}`);
  const r = new Function(`return (${s})`)();
  if (!Number.isFinite(r)) throw new Error('bad');
  return Math.round(r * 1e10) / 1e10;
}