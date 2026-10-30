import { useState } from 'react';
import { Calculator as CalcIcon, PenLine } from 'lucide-react';
import Calculator from '@/components/exam/Calculator';
import FormulaSheet from '@/components/exam/FormulaSheet';
import Scratchpad from './Scratchpad';

const Btn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} title={label} aria-label={label}
    className={`w-11 h-11 rounded-full border grid place-items-center transition-all ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card/90 border-border text-muted-foreground hover:text-foreground hover:border-primary/50'}`}>
    <Icon className="w-5 h-5" />
  </button>
);

export default function ToolsHUD() {
  const [calc, setCalc] = useState(false);
  const [pad, setPad] = useState(false);
  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        <Btn icon={CalcIcon} label="Calculadora científica" active={calc} onClick={() => setCalc((v) => !v)} />
        <Btn icon={PenLine} label="Scratchpad" active={pad} onClick={() => setPad((v) => !v)} />
        <FormulaSheet hud />
      </div>
      {calc && <Calculator onClose={() => setCalc(false)} />}
      {pad && <Scratchpad onClose={() => setPad(false)} />}
    </>
  );
}