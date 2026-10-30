import SimReadout from './SimReadout';

const f = (n) => +n.toFixed(2);

export default function VectorStats({ A, B }) {
  const dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  const C = [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
  const ma = Math.hypot(...A), mb = Math.hypot(...B);
  const ang = ma && mb ? (Math.acos(Math.max(-1, Math.min(1, dot / (ma * mb)))) * 180) / Math.PI : 0;
  return (
    <SimReadout items={[
      { label: 'A · B', value: f(dot), unit: '', color: 'text-cyan-300' },
      { label: 'A × B', value: `(${C.map(f).join(', ')})`, unit: '', color: 'text-violet-300' },
      { label: '|A| · |B|', value: `${f(ma)} · ${f(mb)}`, unit: '' },
      { label: 'Ángulo θ', value: f(ang), unit: '°', color: 'text-amber-300' },
    ]} />
  );
}