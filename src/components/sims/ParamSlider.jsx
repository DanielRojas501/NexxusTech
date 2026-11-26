import { Slider } from '@/components/ui/slider';

const decimals = (s) => (s >= 1 ? 0 : s >= 0.1 ? 1 : 2);

export default function ParamSlider({ label, value, unit = '', min, max, step = 1, onChange }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-primary">
          {Number(value).toFixed(decimals(step))} <span className="text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}