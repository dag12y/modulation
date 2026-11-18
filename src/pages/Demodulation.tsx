import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Download,
  Info,
  Radio,
  RotateCcw,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
import { Equation } from '@/components/Equation';
import { FlowDiagram } from '@/components/FlowDiagram';
import { WaveformChart } from '@/components/charts/WaveformChart';
import { ReceiverSpectrumChart } from '@/components/charts/SpectrumChart';
import { EnvelopeDetectorLab } from '@/components/simulation/EnvelopeDetectorLab';
import { experiments } from '@/data/experiments';
import type { ExperimentData } from '@/data/experiments';
import { signalKeys } from '@/data/mockSignals';
import { Link } from '@/app/router';
import {
  buildSsbCsv,
  DEFAULT_SSB_PARAMS,
  simulateSsb,
  type BasebandShape,
  type SsbParams,
  type SsbSimulationResult,
} from '@/lib/ssb';

function triggerCsvDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function RxSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  digits = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  digits?: number;
  onChange: (val: number) => void;
}) {
  return (
    <label className="dial-field rx-dial">
      <span>
        {label}
        <output>
          {value > 0 && min < 0 ? '+' : ''}
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
        onChange={(ev) => onChange(Number(ev.target.value))}
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

function SsbDemodulationWorkspace({
  experiment: e,
  params,
  simulation,
  onParamsChange,
  onExport,
}: {
  experiment: ExperimentData;
  params: SsbParams;
  simulation: SsbSimulationResult;
  onParamsChange: (patch: Partial<SsbParams>) => void;
  onExport: () => void;
}) {
  const [showReference, setShowReference] = useState(true);
  const [showMixer, setShowMixer] = useState(true);

  const yMax = Math.max(
    2,
    Math.ceil(Math.max(params.AmV * 2.2, params.AcV * params.AmV)),
  );
  const loFreqKHz = params.fcKHz + params.freqOffsetHz / 1000;
  const { metrics } = simulation;

  const diagnostic = useMemo(() => {
    if (params.lpfCutoffKHz >= 2 * params.fcKHz - 3) {
      return {
        status: '2fc leakage',
        tone: 'warn',
        text: `LPF cutoff (${params.lpfCutoffKHz.toFixed(1)} kHz) is too close to 2fc (${(2 * params.fcKHz).toFixed(1)} kHz), allowing double-frequency mixer ripple to pass into the recovered message.`,
      };
    }
    if (params.lpfCutoffKHz < metrics.messageBandwidthKHz * 0.95) {
      return {
        status: 'Bandwidth clipped',
        tone: 'warn',
        text: `LPF cutoff (${params.lpfCutoffKHz.toFixed(1)} kHz) is below the ${metrics.messageBandwidthKHz.toFixed(1)} kHz message bandwidth, attenuating the recovered baseband signal.`,
      };
    }
    if (Math.abs(params.freqOffsetHz) >= 20) {
      return {
        status: 'Frequency drift',
        tone: 'warn',
        text: `LO offset Δf = ${params.freqOffsetHz > 0 ? '+' : ''}${params.freqOffsetHz} Hz shifts every recovered frequency component by Δf, causing continuous phase drift and beating against m(t).`,
      };
    }
    if (Math.abs(params.phaseErrorDeg) >= 5) {
      return {
        status: 'Phase distortion',
        tone: 'warn',
        text: `LO phase error Δφ = ${params.phaseErrorDeg}° scales m(t) by cos(Δφ) and mixes in quadrature Hilbert component m̂(t)·sin(Δφ), altering the waveform shape.`,
      };
    }
    return {
      status: 'Coherent lock',
      tone: 'ok',
      text: `LO locked at ${loFreqKHz.toFixed(3)} kHz (Δφ = 0°) and LPF at ${params.lpfCutoffKHz.toFixed(1)} kHz suppresses 2fc by ${metrics.lpfRejectionDb.toFixed(1)} dB. Recovered signal matches m(t).`,
    };
  }, [params, loFreqKHz, metrics]);

  const shapeOptions: Array<{ id: BasebandShape; label: string }> = [
    { id: 'tone', label: 'Single tone' },
    { id: 'two-tone', label: 'Two-tone' },
    { id: 'harmonic', label: 'Harmonic' },
  ];

  return (
    <>
      <section className="card demodulation-flow">
        <div className="card-heading">
          <div>
            <h2>Coherent SSB product detector</h2>
            <p>
              Multiply {e.name} ({params.sideband}) by a synchronized local
              oscillator at {loFreqKHz.toFixed(2)} kHz, then low-pass filter to
              isolate m(t).
            </p>
          </div>
          <span className="badge">LIVE COHERENT RECEIVER</span>
        </div>
        <FlowDiagram demodulation />
      </section>

      <div className="demodulation-grid ssb-rx-grid">
        <section className="card ssb-rx-scopes">
          <div className="rx-scope-header">
            <div>
              <span className="instrument-kicker">RECEIVER SIGNAL CHAIN</span>
              <h3>Time & frequency recovery</h3>
            </div>
            <div className="rx-scope-toggles">
              <button
                type="button"
                aria-pressed={showReference}
                className={`rx-toggle ${showReference ? 'active' : ''}`}
                onClick={() => setShowReference((v) => !v)}
              >
                Overlay m(t)
              </button>
              <button
                type="button"
                aria-pressed={showMixer}
                className={`rx-toggle ${showMixer ? 'active' : ''}`}
                onClick={() => setShowMixer((v) => !v)}
              >
                Show mixer stage
              </button>
              <button
                type="button"
                className="rx-toggle"
                onClick={onExport}
                title="Download simulated SSB TX + RX waveforms as CSV"
              >
                <Download size={12} /> CSV
              </button>
            </div>
          </div>

          <WaveformChart
            label={`Received SSB-${params.sideband} Signal`}
            symbol="s(t)"
            signal="ssb"
            color="#a3e635"
            data={simulation.samples as unknown as Record<string, number>[]}
            yDomain={[-yMax, yMax]}
            onDownload={onExport}
          />
          {showMixer && (
            <WaveformChart
              label="Product Modulator Output (before LPF)"
              symbol="v(t)"
              signal="mixer"
              color="#fbbf24"
              data={simulation.samples as unknown as Record<string, number>[]}
              yDomain={[-yMax, yMax]}
              onDownload={onExport}
            />
          )}
          <WaveformChart
            label="Recovered Baseband Message"
            symbol="m(t)"
            signal="recovered"
            color="#38bdf8"
            data={simulation.samples as unknown as Record<string, number>[]}
            yDomain={[-yMax, yMax]}
            referenceKey={showReference ? 'message' : undefined}
            referenceName="Original m(t) (V)"
            referenceColor="#94a3b8"
            onDownload={onExport}
          />

          <div className="rx-spectrum-card">
            <div className="rx-spectrum-head">
              <span>
                DEMODULATED SPECTRUM (0 –{' '}
                {(simulation.receiverSpectrum.at(-1)?.frequency ?? 25).toFixed(
                  0,
                )}{' '}
                kHz)
              </span>
              <span>
                <b style={{ color: '#fbbf24' }}>■</b> Mixer{' '}
                <b style={{ color: '#38bdf8', marginLeft: 8 }}>■</b> After LPF
              </span>
            </div>
            <ReceiverSpectrumChart
              data={simulation.receiverSpectrum}
              lpfCutoffKHz={params.lpfCutoffKHz}
            />
          </div>

          <div className="chart-footnote">
            Real-time coherent product detection + 4th-order zero-phase
            Butterworth LPF (4 ms display window, 204.8 kHz FFT grid).
          </div>
        </section>

        <section className="card method-card ssb-rx-controls">
          <div className="rx-controls-top">
            <div>
              <span className="eyebrow">
                <SlidersHorizontal size={12} /> RECEIVER TUNING
              </span>
              <h2>Local oscillator & LPF</h2>
            </div>
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={() =>
                onParamsChange({
                  freqOffsetHz: 0,
                  phaseErrorDeg: 0,
                  lpfCutoffKHz: 4.0,
                })
              }
            >
              <RotateCcw size={12} /> Lock LO
            </button>
          </div>

          <div className="rx-presets">
            <span className="rx-sublabel">Demo presets</span>
            <div className="rx-preset-buttons">
              <button
                type="button"
                onClick={() =>
                  onParamsChange({
                    freqOffsetHz: 0,
                    phaseErrorDeg: 0,
                    lpfCutoffKHz: 4.0,
                  })
                }
              >
                Ideal lock
              </button>
              <button
                type="button"
                onClick={() =>
                  onParamsChange({
                    shape: 'harmonic',
                    freqOffsetHz: 0,
                    phaseErrorDeg: 45,
                    lpfCutoffKHz: 4.0,
                  })
                }
              >
                Phase error 45°
              </button>
              <button
                type="button"
                onClick={() =>
                  onParamsChange({
                    freqOffsetHz: 150,
                    phaseErrorDeg: 0,
                    lpfCutoffKHz: 4.0,
                  })
                }
              >
                Freq drift +150 Hz
              </button>
              <button
                type="button"
                onClick={() =>
                  onParamsChange({
                    freqOffsetHz: 0,
                    phaseErrorDeg: 0,
                    lpfCutoffKHz: Math.min(24, params.fcKHz * 2 + 2),
                  })
                }
              >
                2fc LPF leak
              </button>
            </div>
          </div>

          <div className="rx-tx-quick">
            <div>
              <span className="rx-sublabel">Transmitted sideband</span>
              <div className="rx-segmented-light">
                {(['USB', 'LSB'] as const).map((sb) => (
                  <button
                    key={sb}
                    type="button"
                    aria-pressed={params.sideband === sb}
                    className={params.sideband === sb ? 'selected' : ''}
                    onClick={() => onParamsChange({ sideband: sb })}
                  >
                    {sb}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="rx-sublabel">Message shape</span>
              <div className="rx-segmented-light">
                {shapeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={params.shape === opt.id}
                    className={params.shape === opt.id ? 'selected' : ''}
                    onClick={() => onParamsChange({ shape: opt.id })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rx-sliders-box instrument-surface">
            <RxSlider
              label="LO frequency offset (Δf)"
              value={params.freqOffsetHz}
              min={-250}
              max={250}
              step={10}
              unit="Hz"
              onChange={(freqOffsetHz) => onParamsChange({ freqOffsetHz })}
            />
            <RxSlider
              label="LO phase error (Δφ)"
              value={params.phaseErrorDeg}
              min={-90}
              max={90}
              step={5}
              unit="°"
              onChange={(phaseErrorDeg) => onParamsChange({ phaseErrorDeg })}
            />
            <RxSlider
              label="LPF cutoff frequency"
              value={params.lpfCutoffKHz}
              min={0.5}
              max={24}
              step={0.5}
              digits={1}
              unit="kHz"
              onChange={(lpfCutoffKHz) => onParamsChange({ lpfCutoffKHz })}
            />
          </div>

          <div className="rx-metrics-grid">
            <div className="rx-metric">
              <span>Recovery RMSE</span>
              <strong>{metrics.rmseV.toFixed(3)} V</strong>
            </div>
            <div className="rx-metric">
              <span>Correlation (r)</span>
              <strong>{metrics.correlation.toFixed(3)}</strong>
            </div>
            <div className="rx-metric">
              <span>2fc Rejection</span>
              <strong>{metrics.lpfRejectionDb.toFixed(1)} dB</strong>
            </div>
            <div className="rx-metric">
              <span>LO Frequency</span>
              <strong>{loFreqKHz.toFixed(2)} kHz</strong>
            </div>
          </div>

          <div className="rx-equation-card">
            <Equation
              math={String.raw`v(t)=A'_c\cos(2\pi f_c t+\phi)\,s(t)`}
              block
            />
          </div>

          <div className={`rx-diagnostic ${diagnostic.tone}`}>
            {diagnostic.tone === 'ok' ? (
              <CheckCircle2 size={17} />
            ) : (
              <Activity size={17} />
            )}
            <div>
              <strong>{diagnostic.status}</strong>
              <p>{diagnostic.text}</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export function DemodulationContent({
  experiment: e = experiments[0],
  ssbParams,
  ssbSimulation,
  onSsbParamsChange,
  onExportSsb,
}: {
  experiment?: ExperimentData;
  ssbParams?: SsbParams;
  ssbSimulation?: SsbSimulationResult;
  onSsbParamsChange?: (patch: Partial<SsbParams>) => void;
  onExportSsb?: () => void;
}) {
  const [localParams, setLocalParams] = useState<SsbParams>(DEFAULT_SSB_PARAMS);
  const activeParams = ssbParams ?? localParams;
  const localSim = useMemo(
    () =>
      e.id === 'ssb-sc' && !ssbSimulation ? simulateSsb(activeParams) : null,
    [e.id, ssbSimulation, activeParams],
  );
  const activeSim = ssbSimulation ?? localSim;

  const handleParamsChange = (patch: Partial<SsbParams>) => {
    if (onSsbParamsChange) onSsbParamsChange(patch);
    else setLocalParams((prev) => ({ ...prev, ...patch }));
  };

  const handleExport = () => {
    if (onExportSsb) {
      onExportSsb();
      return;
    }
    if (!activeSim) return;
    const csv = buildSsbCsv(activeSim.samples, activeParams);
    triggerCsvDownload(
      csv,
      `ssb-${activeParams.sideband.toLowerCase()}-demodulation.csv`,
    );
  };

  if (e.id === 'dsb-fc') {
    return (
      <>
        <section className="card demodulation-flow">
          <div className="card-heading">
            <div>
              <h2>Envelope detector receiver chain</h2>
              <p>
                Half-wave rectification and RC low-pass smoothing for{' '}
                {e.fullName} (DSB-LC).
              </p>
            </div>
            <span className="badge">INTERACTIVE LAB</span>
          </div>
          <FlowDiagram demodulation envelopeDetector />
        </section>
        <EnvelopeDetectorLab />
      </>
    );
  }

  if (e.id === 'ssb-sc' && activeSim) {
    return (
      <SsbDemodulationWorkspace
        experiment={e}
        params={activeParams}
        simulation={activeSim}
        onParamsChange={handleParamsChange}
        onExport={handleExport}
      />
    );
  }

  return (
    <>
      <section className="card demodulation-flow">
        <div className="card-heading">
          <div>
            <h2>From carrier back to message</h2>
            <p>A conceptual receiver chain for {e.name}.</p>
          </div>
          <span className="badge neutral">ILLUSTRATION ONLY</span>
        </div>
        <FlowDiagram demodulation />
      </section>
      <div className="demodulation-grid">
        <section className="card">
          <WaveformChart
            label="Received Signal"
            symbol="s(t)"
            signal={signalKeys[e.id]}
            color="#a3e635"
          />
          <WaveformChart
            label="Recovered Message"
            symbol="m̂(t)"
            signal="message"
            color="#38bdf8"
          />
          <div className="chart-footnote">
            Both waveforms are independent, fixed illustrations.
          </div>
        </section>
        <section className="card method-card">
          <span className="method-icon">
            <Waves size={25} />
          </span>
          <span className="eyebrow">DEMODULATION METHOD</span>
          <h2>{e.method.replace('*', '')}</h2>
          <p>
            A synchronized local oscillator provides a carrier reference. Mixing
            and low-pass filtering can then recover the message. Correct
            frequency and phase alignment are essential.
          </p>
          <div className="method-detail">
            <strong>Why envelope detection cannot be used here</strong>
            <p>
              Because {e.name} suppresses the carrier, the signal undergoes 180°
              phase reversals whenever the message crosses zero—requiring
              coherent (synchronous) detection rather than an envelope detector.
            </p>
          </div>
          <div className="educational-note">
            <Info size={17} />
            <span>
              Explore live envelope detection and over-modulation phase
              reversals in the{' '}
              <Link className="text-link" to="/demodulation">
                Envelope Detector lab <ArrowRight size={12} />
              </Link>
              .
            </span>
          </div>
        </section>
      </div>
    </>
  );
}

export function Demodulation() {
  const [selectedId, setSelectedId] = useState<ExperimentData['id']>('dsb-fc');
  const selectedExperiment =
    experiments.find((item) => item.id === selectedId) ?? experiments[0];

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div className="eyebrow">
          <Radio size={14} /> CHAPTER 2 · AM DEMODULATION LAB
        </div>
        <h1>Bring the message home.</h1>
        <p>
          Simulate conventional AM (DSB-LC) envelope detection or switch to
          SSB-SC for live coherent product detection with local oscillator phase
          and frequency synchronization.
        </p>
      </div>
      <nav
        className="experiment-switcher"
        aria-label="Choose receiver modulation technique"
      >
        {experiments.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            aria-pressed={selectedExperiment.id === item.id}
            className={`rx-switcher-btn ${selectedExperiment.id === item.id ? 'active' : ''}`}
          >
            <span>{item.number}</span>
            {item.name}
            <small>
              {item.id === 'dsb-fc'
                ? 'Live envelope RX'
                : item.id === 'ssb-sc'
                  ? 'Live coherent RX'
                  : item.method.replace('*', '')}
            </small>
          </button>
        ))}
      </nav>
      <DemodulationContent experiment={selectedExperiment} />
    </div>
  );
}
