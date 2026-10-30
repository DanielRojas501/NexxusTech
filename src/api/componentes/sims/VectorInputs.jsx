const Row = ({ name, v, set, color }) => (
  <div className="flex items-center gap-2">
    <span className={`font-mono text-sm w-6 ${color}`}>{name}</span>
    {v.map((c, i) => (
      <input
        key={i}
        type="number"
        step="0.5"
        value={c}
        onChange={(e) => { const n = [...v]; n[i] = Number(e.target.value) || 0; set(n); }}
        className="w-full min-w-0 rounded-lg bg-slate-950/60 border border-border/60 px-2 py-1.5 font-mono text-sm focus:outline-none focus:border-primary"
      />
    ))}
  </div>
);

export default function VectorInputs({ A, B, setA, setB }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Row name="A" v={A} set={setA} color="text-cyan-300" />
      <Row name="B" v={B} set={setB} color="text-pink-400" />
    </div>
  );
}