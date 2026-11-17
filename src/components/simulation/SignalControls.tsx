import { useState } from 'react';
import { Info, SlidersHorizontal } from 'lucide-react';
import { experiments } from '@/data/experiments';
import type { ExperimentData } from '@/data/experiments';
import { Switch } from '@/components/ui/switch';
function Slider({
  label,
  initial,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  initial: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <label className="slider-field">
      <span>
        {label}
        <output>
          {value.toFixed(step < 1 ? 1 : 0)} <small>{unit}</small>
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={
          {
            '--range-progress': `${((value - min) / (max - min)) * 100}%`,
          } as React.CSSProperties
        }
      />
      <span className="range-limits">
        <small>
          {min} {unit}
        </small>
        <small>
          {max} {unit}
        </small>
      </span>
    </label>
  );
}
export function SignalControls({
  experiment,
  sideband,
  onSideband,
}: {
  experiment: ExperimentData;
  sideband: string;
  onSideband: (s: string) => void;
}) {
  const [selected, setSelected] = useState(experiment.id);
  return (
    <aside className="signal-controls">
      <div className="controls-heading">
        <span>
          <SlidersHorizontal size={17} />
          Signal Controls
        </span>
        <span className="instrument-dot" />
      </div>
      <p className="controls-intro">Fine-tune your signal parameters.</p>
      <label className="select-field">
        Modulation type
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as typeof selected)}
        >
          {experiments.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      <span className="controls-eyebrow">SIGNAL PARAMETERS</span>
      <Slider
        label="Message frequency"
        initial={1}
        min={0.1}
        max={5}
        step={0.1}
        unit="kHz"
      />
      <Slider
        label="Carrier frequency"
        initial={10}
        min={5}
        max={50}
        step={1}
        unit="kHz"
      />
      <Slider
        label="Message amplitude"
        initial={0.7}
        min={0.1}
        max={2}
        step={0.1}
        unit="V"
      />
      <Slider
        label="Carrier amplitude"
        initial={1}
        min={0.1}
        max={2}
        step={0.1}
        unit="V"
      />
      {selected === 'dsb-fc' && (
        <Slider
          label="Modulation index (μ)"
          initial={0.7}
          min={0}
          max={1.5}
          step={0.1}
          unit=""
        />
      )}
      {selected === 'ssb-sc' && (
        <div className="control-sideband">
          <span>Sideband selection</span>
          <div className="segmented dark">
            {['USB', 'LSB'].map((s) => (
              <button
                key={s}
                onClick={() => onSideband(s)}
                aria-pressed={sideband === s}
                className={sideband === s ? 'selected' : ''}
              >
                {s}
              </button>
            ))}
          </div>
          <small>Illustrative selection only</small>
        </div>
      )}
      {selected === 'vsb' && (
        <Slider
          label="Filter bandwidth"
          initial={1.25}
          min={1}
          max={2}
          step={0.05}
          unit="kHz"
        />
      )}
      <div className="display-options">
        <span className="controls-eyebrow">DISPLAY OPTIONS</span>
        {['Show Envelope', 'Show Spectrum', 'Show Grid', 'Show Markers'].map(
          (label, i) => (
            <label key={label}>
              <span>{label}</span>
              <Switch aria-label={label} defaultChecked={i < 3} />
            </label>
          ),
        )}
      </div>
      <div className="controls-notice">
        <Info size={15} />
        <p>
          Static preview. Settings are illustrative and do not update the
          charts.
        </p>
      </div>
    </aside>
  );
}
