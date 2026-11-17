import { useState } from 'react';
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
const channels = [
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
export function Experiment({ experiment: e }: { experiment: ExperimentData }) {
  const [mode, setMode] = useState('Stacked');
  const [sideband, setSideband] = useState('USB');
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState({
    message: true,
    carrier: true,
    modulated: true,
  });
  const hasVisibleSignals = Object.values(visible).some(Boolean);
  const lastVisibleChannel = channels.filter((c) => visible[c.key]).at(-1)?.key;
  const modulationSummary =
    e.id === 'dsb-fc'
      ? ['μ', '0.70']
      : e.id === 'vsb'
        ? ['BW', '1.25 kHz']
        : e.id === 'ssb-sc'
          ? ['Mode', sideband]
          : ['Mode', 'Balanced'];
  const traces = (
    <>
      {!hasVisibleSignals ? (
        <div className="scope-empty">
          Select a signal above to inspect its waveform.
        </div>
      ) : mode === 'Overlay' ? (
        <WavePlot
          signal={signalKeys[e.id]}
          color="#a3e635"
          overlay
          tall
          visible={visible}
        />
      ) : (
        channels.map(
          (c) =>
            visible[c.key] && (
              <div className="scope-channel" key={c.key}>
                <div className="scope-channel-label" style={{ color: c.color }}>
                  <span>{c.symbol}</span>
                  <small>{c.label}</small>
                  <span>
                    {c.key === 'message'
                      ? '1 kHz'
                      : c.key === 'carrier'
                        ? '10 kHz'
                        : e.name}
                  </span>
                </div>
                <WavePlot
                  signal={c.key === 'modulated' ? signalKeys[e.id] : c.key}
                  color={c.color}
                  showTimeAxis={c.key === lastVisibleChannel}
                />
              </div>
            ),
        )
      )}
    </>
  );
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
                    ? 'Single sideband'
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
            aria-label={`${e.name} static instrument workspace`}
          >
            <div className="bench-topline">
              <span>
                <ScanLine size={15} /> SIGNAL ANALYSIS <b>/</b> {e.name}
              </span>
              <span className="fixed-status">
                <i /> FIXED REFERENCE DATA
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
                    <b>fm</b> 1.0 kHz
                  </span>
                  <span>
                    <b>fc</b> 10 kHz
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
                  {channels.map((c) => (
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
                  <span>Relative magnitude</span>
                  <span>|S(f)|</span>
                </div>
                <SpectrumChart id={e.id} sideband={sideband} />
                <div className="spectral-legend">
                  <span>
                    <i className="sideband-swatch" />
                    Sideband
                  </span>
                  {e.id === 'dsb-fc' && (
                    <span>
                      <i className="carrier-swatch" />
                      Carrier
                    </span>
                  )}
                </div>
                <div className="bandwidth-readout">
                  <span>
                    OCCUPIED BANDWIDTH<strong>{e.bandwidth}</strong>
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
                        ? `${sideband} illustration selected. One sideband carries the information.`
                        : 'Broadband schematic: one full sideband and a 0.25 kHz vestige. Suppressed carrier.'}
                </p>
                <p className="spectrum-disclaimer">
                  Positive-frequency illustration · no FFT
                </p>
              </section>
              <SignalControls
                experiment={e}
                sideband={sideband}
                onSideband={setSideband}
              />
            </div>
            <div className="bench-footer">
              <span>AM STUDIO / INSTRUMENT 0{Number(e.number)}</span>
              <span>Static teaching illustrations · no simulation running</span>
            </div>
          </section>
          <section className="learning-strip">
            <div className="learning-model">
              <span className="eyebrow">
                <BookOpen size={13} /> THE MATHEMATICAL MODEL
              </span>
              <Equation
                math={
                  e.equations[e.id === 'ssb-sc' && sideband === 'LSB' ? 1 : 0]
                }
                block
              />
              <p>
                {e.id === 'vsb'
                  ? 'An asymmetric filter retains one sideband and a vestige of the other.'
                  : 'An ideal single-tone model. The plots use bundled reference data.'}
              </p>
              <Link className="text-link" to="/theory">
                Unpack the equation <ArrowRight size={13} />
              </Link>
            </div>
            <div className="learning-insight">
              <span className="eyebrow">THE KEY INSIGHT</span>
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
                {[
                  ['Carrier', e.carrier],
                  ['Sidebands', e.id === 'ssb-sc' ? sideband : e.sidebands],
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
            aria-label="Understand the three signals"
          >
            {channels.map((c) => (
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
          <DemodulationContent experiment={e} />
        </TabsContent>
      </Tabs>
      <Dialog
        open={expanded}
        onOpenChange={setExpanded}
        title={`${e.name} / Oscilloscope`}
        description="Fixed reference traces · Amplitude (V) over Time (ms)"
        className="scope-dialog instrument-surface"
      >
        <div className="expanded-traces">{traces}</div>
      </Dialog>
    </div>
  );
}
