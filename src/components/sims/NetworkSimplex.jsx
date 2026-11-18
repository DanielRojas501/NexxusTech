import { useState } from 'react';
import SimShell from './SimShell';
import Pills from './Pills';
import MaxFlowGraph from './MaxFlowGraph';
import SimplexTableau from './SimplexTableau';

export default function NetworkSimplex() {
  const [tab, setTab] = useState('flow');
  return (
    <SimShell title="Redes e Investigación de Operaciones" subtitle={tab === 'flow' ? 'Flujo máximo por caminos aumentantes (Edmonds-Karp)' : 'Máx Z = 3x₁ + 5x₂ · s.a. x₁ ≤ 4, 2x₂ ≤ 12, 3x₁ + 2x₂ ≤ 18'}>
      <Pills options={[{ id: 'flow', label: 'Flujo máximo' }, { id: 'simplex', label: 'Método Simplex' }]} value={tab} onChange={setTab} />
      {tab === 'flow' ? <MaxFlowGraph /> : <SimplexTableau />}
    </SimShell>
  );
}