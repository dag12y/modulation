import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Download, RotateCcw, SlidersHorizontal } from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
import type { BasebandShape, SsbParams } from '@/lib/ssb';

function Slider({
  label,
  initial,
  controlledValue,
  onValueChange,
  min,
  max,
  step,
  unit,
}: {
  label: string;
  initial?: number;
  controlledValue?: number;
  onValueChange?: (val: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const [internalValue, setInternalValue] = useState(initial ?? min);
  const value = controlledValue ?? internalValue;
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
        onChange={(ev) => {
          const next = Number(ev.target.value);
          if (onValueChange) onValueChange(next);
          else setInternalValue(next);
        }}
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

const SHAPE_OPTIONS: Array<{ id: BasebandShape; label: string }> = [
  { id: 'tone', label: 'Single tone' },
  { id: 'two-tone', label: 'Two-tone' },
  { id: 'harmonic', label: 'Harmonic' },
];

export function SignalControls({
  experiment: e,
  sideband,
  onSideband,
  ssbParams,
  onSsbParamsChange,
  onResetSsb,
  onExportSsb,
}: {
  experiment: ExperimentData;
  sideband: string;
  onSideband: (s: string) => void;
  ssbParams?: SsbParams;
  onSsbParamsChange?: (patch: Partial<SsbParams>) => void;
  onResetSsb?: () => void;
  onExportSsb?: () => void;
}) {
  const isLiveSsb =
    e.id === 'ssb-sc' && Boolean(ssbParams && onSsbParamsChange);

  return (
    <section className="instrument-controls" id="signal-parameters">
      <div className="instrument-controls-title">
        <SlidersHorizontal size={16} />
        <h3>Signal parameters</h3>
        <span>{isLiveSsb ? 'LIVE DSP ENGINE' : 'PARAMETER PREVIEW'}</span>
      </div>
      <div className="parameter-bank">
        <div className="parameter-pair">
          <span className="channel-label message-color">01 / MESSAGE</span>
          <Slider
            label="Frequency"
            initial={1}
            controlledValue={isLiveSsb ? ssbParams?.fmKHz : undefined}
            onValueChange={
              isLiveSsb ? (fmKHz) => onSsbParamsChange?.({ fmKHz }) : undefined
            }
            min={isLiveSsb ? 0.5 : 0.1}
            max={isLiveSsb ? 3.5 : 5}
            step={0.1}
            unit="kHz"
          />
          <Slider
            label="Amplitude"
            initial={0.7}
            controlledValue={isLiveSsb ? ssbParams?.AmV : undefined}
            onValueChange={
              isLiveSsb ? (AmV) => onSsbParamsChange?.({ AmV }) : undefined
            }
            min={isLiveSsb ? 0.2 : 0.1}
            max={2}
            step={0.1}
            unit="V"
          />
          {isLiveSsb && ssbParams && (
            <div className="sideband-control ssb-shape-control">
              <span>Message waveform</span>
              <div className="segmented">
                {SHAPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={ssbParams.shape === opt.id}
                    className={ssbParams.shape === opt.id ? 'selected' : ''}
                    onClick={() => onSsbParamsChange?.({ shape: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="parameter-pair">
          <span className="channel-label carrier-color">02 / CARRIER</span>
          <Slider
            label="Frequency"
            initial={10}
            controlledValue={isLiveSsb ? ssbParams?.fcKHz : undefined}
            onValueChange={
              isLiveSsb ? (fcKHz) => onSsbParamsChange?.({ fcKHz }) : undefined
            }
            min={isLiveSsb ? 6 : 5}
            max={isLiveSsb ? 25 : 50}
            step={1}
            unit="kHz"
          />
          <Slider
            label="Amplitude"
            initial={1}
            controlledValue={isLiveSsb ? ssbParams?.AcV : undefined}
            onValueChange={
              isLiveSsb ? (AcV) => onSsbParamsChange?.({ AcV }) : undefined
            }
            min={isLiveSsb ? 0.2 : 0.1}
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
              <span>
                {isLiveSsb ? 'Selected sideband' : 'Reference spectrum'}
              </span>
              <div className="segmented">
                {(['USB', 'LSB'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={sideband === s}
                    className={sideband === s ? 'selected' : ''}
                    onClick={() => {
                      onSideband(s);
                      if (isLiveSsb) onSsbParamsChange?.({ sideband: s });
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <small>
                {isLiveSsb
                  ? 'Phase-shift Hilbert synthesis cancels the unwanted sideband in real time.'
                  : 'Spectrum fixture only; time trace stays fixed.'}
              </small>
              {isLiveSsb && (
                <div className="ssb-control-actions">
                  {onResetSsb && (
                    <button
                      type="button"
                      className="ssb-action-btn"
                      onClick={onResetSsb}
                    >
                      <RotateCcw size={12} /> Reset
                    </button>
                  )}
                  {onExportSsb && (
                    <button
                      type="button"
                      className="ssb-action-btn"
                      onClick={onExportSsb}
                    >
                      <Download size={12} /> Export CSV
                    </button>
                  )}
                </div>
              )}
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
            {isLiveSsb ? (
              <>
                Live phase-shift SSB modulator.
                <br />
                Scope, FFT, and receiver update together.
              </>
            ) : (
              <>
                Sliders change readouts only.
                <br />
                Waveforms remain fixed.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
