import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Maximize2,
  Radio,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
import { experiments } from '@/data/experiments';
import { SignalControls } from '@/components/simulation/SignalControls';
import { WavePlot } from '@/components/charts/WaveformChart';
import { SpectrumChart } from '@/components/charts/SpectrumChart';
import { signalKeys } from '@/data/mockSignals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { ExperimentTheory } from './Theory';
import { DemodulationContent } from './Demodulation';
import { Equation } from '@/components/Equation';
import { Link } from '@/app/router';
import {
  buildSsbCsv,
  DEFAULT_SSB_PARAMS,
  simulateSsb,
  type SsbParams,
} from '@/lib/ssb';

const baseChannels = [
  {
    key: 'message',
    label: 'Message',
    symbol: 'm(t)',
    color: '#38bdf8',
    description:
      'The information to transmit. A low-frequency signal at 1 kHz.',
  },
  {
    key: 'carrier',
    label: 'Carrier',
    symbol: 'c(t)',
    color: '#a78bfa',
    description:
      'The 10 kHz reference that shifts information into a higher frequency band.',
  },
  {
    key: 'modulated',
    label: 'Modulated',
    symbol: 's(t)',
    color: '#a3e635',
    description:
      'The transmitted waveform. Its structure depends on the selected technique.',
  },
] as const;

const ssbChannels = [
  {
    key: 'message',
    signalKey: 'message',
    label: 'Message',
    symbol: 'm(t)',
    color: '#38bdf8',
    description:
      'In-phase baseband information signal sent to the upper balanced mixer.',
  },
  {
    key: 'hilbert',
    signalKey: 'hilbert',
    label: 'Hilbert (90°)',
    symbol: 'm̂(t)',
    color: '#fbbf24',
    description:
      '90° phase-shifted message mixed with the quadrature carrier to cancel one sideband.',
  },
  {
    key: 'carrier',
    signalKey: 'carrier',
    label: 'Carrier',
    symbol: 'c(t)',
    color: '#a78bfa',
    description:
      'High-frequency local reference suppressed from the final SSB transmission.',
  },
  {
    key: 'modulated',
    signalKey: 'ssb',
    label: 'SSB Output',
    symbol: 's(t)',
    color: '#a3e635',
    description:
      'Single sideband waveform with carrier and redundant sideband cancelled.',
  },
] as const;

export function Experiment({ experiment: e }: { experiment: ExperimentData }) {
  const isLiveSsb = e.id === 'ssb-sc';
  const [mode, setMode] = useState('Stacked');
  const [sideband, setSideband] = useState('USB');
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState({
    message: true,
    hilbert: false,
    carrier: true,
    modulated: true,
    envelope: false,
  });
  const [ssbParams, setSsbParams] = useState<SsbParams>(DEFAULT_SSB_PARAMS);

  const ssbSimulation = useMemo(
    () => (isLiveSsb ? simulateSsb(ssbParams) : null),
    [isLiveSsb, ssbParams],
  );

  const updateSsbParams = (patch: Partial<SsbParams>) => {
    setSsbParams((prev) => {
      const next = { ...prev, ...patch };
      if (patch.sideband) setSideband(patch.sideband);
      return next;
    });
  };

  const resetSsbParams = () => {
    setSsbParams(DEFAULT_SSB_PARAMS);
    setSideband(DEFAULT_SSB_PARAMS.sideband);
  };

  const exportSsbCsv = () => {
    if (!ssbSimulation) return;
    const csv = buildSsbCsv(ssbSimulation.samples, ssbParams);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ssb-${ssbParams.sideband.toLowerCase()}-${ssbParams.fcKHz}khz.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeChannels = isLiveSsb ? ssbChannels : baseChannels;
  const hasVisibleSignals = activeChannels.some((c) => visible[c.key]);
  const lastVisibleChannel = activeChannels
    .filter((c) => visible[c.key])
    .at(-1)?.key;

  const yMax = isLiveSsb
    ? Math.max(
        2,
        Math.ceil(
          Math.max(
            ssbParams.AmV,
            ssbParams.AcV,
            ssbSimulation?.metrics.peakSsbV ?? 2,
          ) * 1.15,
        ),
      )
    : 2;

  const modulationSummary =
    e.id === 'dsb-fc'
      ? ['μ', '0.70']
      : e.id === 'vsb'
        ? ['BW', '1.25 kHz']
        : e.id === 'ssb-sc'
          ? ['Mode', ssbParams.sideband]
          : ['Mode', 'Balanced'];

  const ssbDisplayData = ssbSimulation?.samples as unknown as
    Record<string, number>[] | undefined;

  const traces = (
    <>
      {!hasVisibleSignals ? (
        <div className="scope-empty">
          Select a signal above to inspect its waveform.
        </div>
      ) : mode === 'Overlay' ? (
        <WavePlot
          signal={isLiveSsb ? 'ssb' : signalKeys[e.id]}
          color="#a3e635"
          overlay
          tall
          data={ssbDisplayData}
          yDomain={[-yMax, yMax]}
          visible={
            isLiveSsb
              ? visible
              : {
                  message: visible.message,
                  carrier: visible.carrier,
                  modulated: visible.modulated,
                }
          }
        />
      ) : (
        activeChannels.map(
          (c) =>
            visible[c.key] && (
              <div className="scope-channel" key={c.key}>
                <div className="scope-channel-label" style={{ color: c.color }}>
                  <span>{c.symbol}</span>
                  <small>{c.label}</small>
                  <span>
                    {c.key === 'message' || c.key === 'hilbert'
                      ? isLiveSsb
                        ? `${ssbParams.fmKHz.toFixed(1)} kHz`
                        : '1 kHz'
                      : c.key === 'carrier'
                        ? isLiveSsb
                          ? `${ssbParams.fcKHz} kHz`
                          : '10 kHz'
                        : isLiveSsb
                          ? `SSB-${ssbParams.sideband}`
                          : e.name}
                  </span>
                </div>
                <WavePlot
                  signal={
                    isLiveSsb && 'signalKey' in c
                      ? c.signalKey
                      : c.key === 'modulated'
                        ? signalKeys[e.id]
                        : c.key
                  }
                  color={c.color}
                  data={ssbDisplayData}
                  yDomain={[-yMax, yMax]}
                  showTimeAxis={c.key === lastVisibleChannel}
                />
              </div>
            ),
        )
      )}
    </>
  );

  const ssbToneSummary = ssbSimulation
    ? ssbSimulation.metrics.activeToneFreqsKHz
        .map((f) =>
          (ssbParams.sideband === 'USB'
            ? ssbParams.fcKHz + f
            : ssbParams.fcKHz - f
          ).toFixed(2),
        )
        .join(' & ')
    : '';

  return (
    <div className="hybrid-experiment page-enter">
      <div className="studio-page-title">
        <div>
          <span className="eyebrow">THE EXPERIMENT BENCH / {e.number}</span>
          <h1>
            {e.fullName}
            <span className="title-period">.</span>
          </h1>
          <p>{e.description}</p>
        </div>
        <span className="page-index">
          {e.number}
          <small> / 04</small>
        </span>
      </div>
      <nav
        className="experiment-switcher"
        aria-label="Choose modulation experiment"
      >
        {experiments.map((item) => (
          <Link
            key={item.id}
            to={`/experiments/${item.id}`}
            aria-current={e.id === item.id ? 'page' : undefined}
            className={e.id === item.id ? 'active' : ''}
          >
            <span>{item.number}</span>
            {item.name}
            <small>
              {item.id === 'dsb-fc'
                ? 'Full carrier'
                : item.id === 'dsb-sc'
                  ? 'Suppressed carrier'
                  : item.id === 'ssb-sc'
                    ? 'Live SSB sim'
                    : 'Vestigial sideband'}
            </small>
          </Link>
        ))}
      </nav>
      <Tabs defaultValue="instrument">
        <TabsList>
          <TabsTrigger value="instrument">Instrument workspace</TabsTrigger>
          <TabsTrigger value="theory">Theory & equations</TabsTrigger>
          <TabsTrigger value="receiver">Receiver view</TabsTrigger>
        </TabsList>
        <TabsContent value="instrument">
          <section
            className="instrument-surface instrument-bench"
            aria-label={`${e.name} ${isLiveSsb ? 'live' : 'static'} instrument workspace`}
          >
            <div className="bench-topline">
              <span>
                <ScanLine size={15} /> SIGNAL ANALYSIS <b>/</b> {e.name}
              </span>
              <span
                className={`fixed-status ${isLiveSsb ? 'live-status' : ''}`}
              >
                <i />{' '}
                {isLiveSsb ? 'LIVE SSB SIMULATION' : 'FIXED REFERENCE DATA'}
              </span>
            </div>
            <div className="analyzer-grid">
              <section className="oscilloscope">
                <div className="scope-toolbar">
                  <div>
                    <span className="instrument-kicker">TIME DOMAIN</span>
                    <h2>Oscilloscope</h2>
                  </div>
                  <div className="scope-actions">
                    <div className="segmented">
                      {['Stacked', 'Overlay'].map((m) => (
                        <button
                          key={m}
                          aria-pressed={mode === m}
                          onClick={() => setMode(m)}
                          className={mode === m ? 'selected' : ''}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <button
                      className="expand-scope"
                      onClick={() => setExpanded(true)}
                      aria-label="Expand oscilloscope"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="scope-param-summary">
                  <span>
                    <b>fm</b>{' '}
                    {isLiveSsb
                      ? `${ssbParams.fmKHz.toFixed(1)} kHz`
                      : '1.0 kHz'}
                  </span>
                  <span>
                    <b>fc</b> {isLiveSsb ? `${ssbParams.fcKHz} kHz` : '10 kHz'}
                  </span>
                  <span>
                    <b>{modulationSummary[0]}</b> {modulationSummary[1]}
                  </span>
                  <button
                    type="button"
                    className="scope-param-link"
                    onClick={() =>
                      document
                        .getElementById('signal-parameters')
                        ?.scrollIntoView({ block: 'center' })
                    }
                  >
                    <SlidersHorizontal size={13} /> Parameters
                  </button>
                </div>
                <div className="scope-legend">
                  {activeChannels.map((c) => (
                    <button
                      key={c.key}
                      aria-pressed={visible[c.key]}
                      onClick={() =>
                        setVisible((v) => ({ ...v, [c.key]: !v[c.key] }))
                      }
                      style={{ color: visible[c.key] ? c.color : '#91a0b8' }}
                    >
                      <i
                        style={{
                          background: visible[c.key] ? c.color : 'transparent',
                          borderColor: c.color,
                        }}
                      />
                      {c.label} <span>{c.symbol}</span>
                    </button>
                  ))}
                  <span>Amplitude / V</span>
                </div>
                <div
                  className={`scope-traces ${mode === 'Overlay' ? 'overlay-traces' : ''}`}
                >
                  {traces}
                </div>
                <div className="scope-bottomline">
                  <span>
                    HORIZONTAL <strong>1 ms / div</strong>
                  </span>
                  <span>
                    Time / ms <b>→</b>
                  </span>
                  <span>
                    WINDOW <strong>4 ms</strong>
                  </span>
                </div>
              </section>
              <section className="frequency-analyzer">
                <div className="scope-toolbar">
                  <div>
                    <span className="instrument-kicker">FREQUENCY DOMAIN</span>
                    <h2>Spectrum analyzer</h2>
                  </div>
                  <Radio size={18} />
                </div>
                <div className="spectrum-axis-caption">
                  <span>
                    {isLiveSsb ? 'Magnitude (V peak)' : 'Relative magnitude'}
                  </span>
                  <span>|S(f)|</span>
                </div>
                <SpectrumChart
                  id={e.id}
                  sideband={isLiveSsb ? ssbParams.sideband : sideband}
                  liveData={ssbSimulation?.spectrum}
                  carrierFreqKHz={isLiveSsb ? ssbParams.fcKHz : undefined}
                />
                <div className="spectral-legend">
                  <span>
                    <i className="sideband-swatch" />
                    {isLiveSsb ? `${ssbParams.sideband} Sideband` : 'Sideband'}
                  </span>
                  {(e.id === 'dsb-fc' || isLiveSsb) && (
                    <span>
                      <i className="carrier-swatch" />
                      {isLiveSsb ? 'Suppressed fc' : 'Carrier'}
                    </span>
                  )}
                </div>
                <div className="bandwidth-readout">
                  <span>
                    OCCUPIED BANDWIDTH
                    <strong>
                      {ssbSimulation
                        ? `${ssbSimulation.metrics.occupiedBandwidthKHz.toFixed(2)} kHz`
                        : e.bandwidth}
                    </strong>
                  </span>
                  <span className="bandwidth-glyph" aria-hidden="true">
                    ↔
                  </span>
                </div>
                <p className="spectrum-description">
                  {e.id === 'dsb-fc'
                    ? 'Carrier at 10 kHz. Equal sidebands at 9 and 11 kHz.'
                    : e.id === 'dsb-sc'
                      ? 'Two equal sidebands. No transmitted carrier component.'
                      : e.id === 'ssb-sc'
                        ? `${ssbParams.sideband} active at ${ssbToneSummary} kHz. Carrier (${ssbParams.fcKHz} kHz) and ${ssbParams.sideband === 'USB' ? 'LSB' : 'USB'} suppressed.`
                        : 'Broadband schematic: one full sideband and a 0.25 kHz vestige. Suppressed carrier.'}
                </p>
                <p className="spectrum-disclaimer">
                  {isLiveSsb
                    ? '4096-point Hann-windowed FFT · 50 Hz bin resolution'
                    : 'Positive-frequency illustration · no FFT'}
                </p>
              </section>
              <SignalControls
                experiment={e}
                sideband={isLiveSsb ? ssbParams.sideband : sideband}
                onSideband={setSideband}
                ssbParams={isLiveSsb ? ssbParams : undefined}
                onSsbParamsChange={isLiveSsb ? updateSsbParams : undefined}
                onResetSsb={isLiveSsb ? resetSsbParams : undefined}
                onExportSsb={isLiveSsb ? exportSsbCsv : undefined}
              />
            </div>
            <div className="bench-footer">
              <span>AM STUDIO / INSTRUMENT 0{Number(e.number)}</span>
              <span>
                {isLiveSsb
                  ? 'Phase discrimination (Hilbert) SSB modulation & coherent detection'
                  : 'Static teaching illustrations · no simulation running'}
              </span>
            </div>
          </section>
          <section className="learning-strip">
            <div className="learning-model">
              <span className="eyebrow">
                <BookOpen size={13} /> THE MATHEMATICAL MODEL
              </span>
              <Equation
                math={
                  e.id === 'ssb-sc'
                    ? ssbParams.shape === 'tone'
                      ? e.equations[ssbParams.sideband === 'LSB' ? 1 : 0]
                      : e.equations[2]
                    : e.equations[0]
                }
                block
              />
              {isLiveSsb && ssbParams.shape === 'tone' && (
                <Equation math={e.equations[2]} block />
              )}
              <p>
                {e.id === 'vsb'
                  ? 'An asymmetric filter retains one sideband and a vestige of the other.'
                  : isLiveSsb
                    ? 'Phase discrimination method (Ch. 2): minus (−) gives USB and plus (+) gives LSB using m(t) and its Hilbert transform m̂(t).'
                    : 'An ideal single-tone model. The plots use bundled reference data.'}
              </p>
              <Link className="text-link" to="/theory">
                Unpack the equation <ArrowRight size={13} />
              </Link>
            </div>
            <div className="learning-insight">
              <span className="eyebrow">
                {isLiveSsb ? 'LIVE SSB MEASUREMENTS' : 'THE KEY INSIGHT'}
              </span>
              <h2>
                {e.id === 'dsb-fc'
                  ? 'The envelope tells the story.'
                  : e.id === 'dsb-sc'
                    ? 'More information per watt.'
                    : e.id === 'ssb-sc'
                      ? 'Half the spectrum. The same message.'
                      : 'A practical middle ground.'}
              </h2>
              <p>{e.efficiency}</p>
              <dl>
                {isLiveSsb && ssbSimulation
                  ? [
                      ['Power Efficiency (η)', '100% (suppressed carrier)'],
                      [
                        'Bandwidth (BW)',
                        `${ssbSimulation.metrics.occupiedBandwidthKHz.toFixed(2)} kHz (BWm)`,
                      ],
                      [
                        'TX Power (50 Ω)',
                        `${ssbSimulation.metrics.avgTxPowerMw.toFixed(2)} mW`,
                      ],
                      [
                        'Sideband Rejection',
                        `>${ssbSimulation.metrics.sidebandSuppressionDb.toFixed(0)} dB`,
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))
                  : [
                      ['Carrier', e.carrier],
                      ['Sidebands', e.sidebands],
                      ['Bandwidth', e.bandwidth],
                      ['Recovery', e.method],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
              </dl>
            </div>
          </section>
          <section
            className="signal-explanations"
            aria-label="Understand the signals"
          >
            {(isLiveSsb ? ssbChannels.slice(0, 3) : baseChannels).map((c) => (
              <div key={c.key}>
                <span style={{ color: c.color }}>{c.symbol}</span>
                <h3>{c.label} signal</h3>
                <p>{c.description}</p>
              </div>
            ))}
          </section>
        </TabsContent>
        <TabsContent value="theory">
          <ExperimentTheory experiment={e} />
        </TabsContent>
        <TabsContent value="receiver">
          <DemodulationContent
            experiment={e}
            ssbParams={isLiveSsb ? ssbParams : undefined}
            ssbSimulation={isLiveSsb ? (ssbSimulation ?? undefined) : undefined}
            onSsbParamsChange={isLiveSsb ? updateSsbParams : undefined}
            onExportSsb={isLiveSsb ? exportSsbCsv : undefined}
          />
        </TabsContent>
      </Tabs>
      <Dialog
        open={expanded}
        onOpenChange={setExpanded}
        title={`${e.name} / Oscilloscope`}
        description={
          isLiveSsb
            ? 'Live SSB simulation · Amplitude (V) over Time (ms)'
            : 'Fixed reference traces · Amplitude (V) over Time (ms)'
        }
        className="scope-dialog instrument-surface"
      >
        <div className="expanded-traces">{traces}</div>
      </Dialog>
    </div>
  );
}
