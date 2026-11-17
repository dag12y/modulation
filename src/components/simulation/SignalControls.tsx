import { useState } from 'react';
import type { CSSProperties } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
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
  const digits = step === 0.05 ? 2 : step < 1 ? 1 : 0;
  return (
    <label className="dial-field">
      <span>
        {label}
        <output>
          {value.toFixed(digits)} <small>{unit}</small>
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value.toFixed(digits)} ${unit}`}
        onChange={(e) => setValue(Number(e.target.value))}
        style={
          {
            '--range-progress': `${((value - min) / (max - min)) * 100}%`,
          } as CSSProperties
        }
      />
      <span className="dial-limits">
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
  experiment: e,
  sideband,
  onSideband,
}: {
  experiment: ExperimentData;
  sideband: string;
  onSideband: (s: string) => void;
}) {
  return (
    <section className="instrument-controls">
      <div className="instrument-controls-title">
        <SlidersHorizontal size={16} />
        <h3>Signal parameters</h3>
        <span>CONTROL PREVIEW</span>
      </div>
      <div className="parameter-bank">
        <div className="parameter-pair">
          <span className="channel-label message-color">01 / MESSAGE</span>
          <Slider
            label="Frequency"
            initial={1}
            min={0.1}
            max={5}
            step={0.1}
            unit="kHz"
          />
          <Slider
            label="Amplitude"
            initial={0.7}
            min={0.1}
            max={2}
            step={0.1}
            unit="V"
          />
        </div>
        <div className="parameter-pair">
          <span className="channel-label carrier-color">02 / CARRIER</span>
          <Slider
            label="Frequency"
            initial={10}
            min={5}
            max={50}
            step={1}
            unit="kHz"
          />
          <Slider
            label="Amplitude"
            initial={1}
            min={0.1}
            max={2}
            step={0.1}
            unit="V"
          />
        </div>
        <div className="parameter-pair">
          <span className="channel-label modulated-color">03 / MODULATION</span>
          {e.id === 'dsb-fc' ? (
            <Slider
              label="Modulation index μ"
              initial={0.7}
              min={0}
              max={1.5}
              step={0.1}
              unit=""
            />
          ) : e.id === 'vsb' ? (
            <Slider
              label="Filter bandwidth"
              initial={1.25}
              min={1}
              max={2}
              step={0.05}
              unit="kHz"
            />
          ) : e.id === 'ssb-sc' ? (
            <div className="sideband-control">
              <span>Reference spectrum</span>
              <div className="segmented">
                {['USB', 'LSB'].map((s) => (
                  <button
                    key={s}
                    aria-pressed={sideband === s}
                    className={sideband === s ? 'selected' : ''}
                    onClick={() => onSideband(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <small>Spectrum fixture only; time trace stays fixed.</small>
            </div>
          ) : (
            <div className="control-reference">
              <strong>Balanced modulation</strong>
              <p>
                Carrier suppressed.
                <br />
                Both sidebands retained.
              </p>
            </div>
          )}
          <p className="parameter-note">
            Sliders change readouts only.
            <br />
            Waveforms remain fixed.
          </p>
        </div>
      </div>
    </section>
  );
}
