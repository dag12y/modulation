import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  CircleHelp,
  Lightbulb,
  Radio,
  Waves,
} from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
import { ExperimentHeader } from '@/components/simulation/ExperimentHeader';
import { SignalControls } from '@/components/simulation/SignalControls';
import { MetricsPanel } from '@/components/simulation/MetricsPanel';
import { WaveformChart } from '@/components/charts/WaveformChart';
import { SpectrumChart } from '@/components/charts/SpectrumChart';
import { signalKeys } from '@/data/mockSignals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExperimentTheory } from './Theory';
import { DemodulationContent } from './Demodulation';
import { Equation } from '@/components/Equation';
import { Link } from '@/app/router';
function FrequencyAnalysis({
  experiment: e,
  sideband,
}: {
  experiment: ExperimentData;
  sideband: string;
}) {
  return (
    <div className="frequency-layout">
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>Frequency-domain perspective</h2>
            <p>Positive-frequency illustration · fixed example data</p>
          </div>
          <span className="badge neutral">MAGNITUDE SPECTRUM</span>
        </div>
        <SpectrumChart id={e.id} sideband={sideband} />
        <div className="educational-note">
          <CircleHelp size={17} />
          <span>
            For a real signal, negative-frequency components mirror the
            positive-frequency spectrum. Only the positive side is shown here.
          </span>
        </div>
      </section>
      <section className="card">
        <h2>Reading the spectrum</h2>
        <div className="reading-list">
          <div>
            <span>01</span>
            <div>
              <h3>Locate the carrier reference</h3>
              <p>
                f꜀ = 10 kHz marks the center frequency, even when the carrier is
                suppressed.
              </p>
            </div>
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>Identify the information</h3>
              <p>
                Sidebands occur around f꜀ ± fₘ. This example uses a 1 kHz
                message.
              </p>
            </div>
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>Consider the bandwidth</h3>
              <p>
                {e.bandwidth} is the illustrative occupied bandwidth. A single
                tone is shown to make the components clear.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export function Experiment({ experiment: e }: { experiment: ExperimentData }) {
  const [mode, setMode] = useState('Stacked');
  const [sideband, setSideband] = useState('USB');
  return (
    <div className="experiment-page page-enter">
      <ExperimentHeader experiment={e} />
      <Tabs defaultValue="simulation">
        <TabsList>
          {[
            { value: 'simulation', label: 'Simulation', icon: Activity },
            { value: 'theory', label: 'Theory & Equations', icon: BookOpen },
            {
              value: 'frequency',
              label: 'Frequency Analysis',
              icon: ChartNoAxesCombined,
            },
            { value: 'demodulation', label: 'Demodulation', icon: Waves },
          ].map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              <t.icon size={15} />
              {t.label}
              {t.value === 'simulation' && (
                <span className="tab-preview">PREVIEW</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="simulation">
          <div className="workspace-caption">
            <span>
              <span className="live-dot" /> SIGNAL WORKSPACE
            </span>
            <span>Illustrative data · controls do not affect charts</span>
          </div>
          <MetricsPanel experiment={e} />
          <div className="simulation-grid">
            <section className="card time-card">
              <div className="card-heading">
                <div>
                  <h2>
                    <Activity size={17} /> Time-Domain Signals
                  </h2>
                  <p>Three perspectives on the same transmission.</p>
                </div>
                <div className="segmented">
                  {['Stacked', 'Overlay'].map((m) => (
                    <button
                      key={m}
                      className={mode === m ? 'selected' : ''}
                      aria-pressed={mode === m}
                      onClick={() => setMode(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {mode === 'Stacked' ? (
                <>
                  <WaveformChart
                    label="Message Signal"
                    symbol="m(t)"
                    signal="message"
                    color="#5577e9"
                  />
                  <WaveformChart
                    label="Carrier Signal"
                    symbol="c(t)"
                    signal="carrier"
                    color="#3aabb8"
                  />
                  <WaveformChart
                    label="Modulated Signal"
                    symbol="s(t)"
                    signal={signalKeys[e.id]}
                    color="#9174cc"
                  />
                </>
              ) : (
                <>
                  <div className="overlay-legend">
                    <span className="blue-dot" /> Message{' '}
                    <span className="cyan-dot" /> Carrier{' '}
                    <span className="violet-dot" /> Modulated
                  </div>
                  <WaveformChart
                    label="Overlaid Signals"
                    symbol="m(t), c(t), s(t)"
                    signal={signalKeys[e.id]}
                    color="#9174cc"
                    overlay
                  />
                </>
              )}
              <div className="chart-footnote">
                <span>Time (ms)</span>
                <span>FIXED SAMPLE · 4 ms WINDOW</span>
              </div>
            </section>
            <div className="spectrum-column">
              <section className="card spectrum-card">
                <div className="card-heading">
                  <div>
                    <h2>
                      <ChartNoAxesCombined size={17} /> Frequency Spectrum
                    </h2>
                    <p>Magnitude response · |S(f)|</p>
                  </div>
                  <span className="badge neutral">STATIC</span>
                </div>
                {e.id === 'ssb-sc' && (
                  <div className="segmented spectrum-selector">
                    {['USB', 'LSB'].map((s) => (
                      <button
                        key={s}
                        className={sideband === s ? 'selected' : ''}
                        aria-pressed={sideband === s}
                        onClick={() => setSideband(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <SpectrumChart id={e.id} sideband={sideband} />
                <div className="spectrum-key">
                  <span>
                    <i /> Sideband
                  </span>
                  {e.id === 'dsb-fc' && (
                    <span>
                      <i className="lime-key" /> Carrier
                    </span>
                  )}
                  <span>Relative magnitude</span>
                </div>
              </section>
              <section className="card quick-equation">
                <span className="eyebrow">
                  <BookOpen size={13} /> SIGNAL EQUATION
                </span>
                <Equation math={e.equations[0]} block />
                <p>
                  {e.id === 'dsb-fc'
                    ? 'The message varies the amplitude of the carrier. The envelope traces the information.'
                    : e.insights[0]}
                </p>
                <Link to="/theory" className="text-link">
                  Explore the mathematics <ArrowRight size={13} />
                </Link>
              </section>
              <div className="spectrum-insight">
                <Radio size={18} />
                <p>
                  {e.id === 'dsb-fc' ? (
                    <>
                      The carrier sits at <strong>10 kHz</strong>, with
                      sidebands at <strong>9 kHz</strong> and{' '}
                      <strong>11 kHz</strong>.
                    </>
                  ) : (
                    <>
                      Carrier reference: <strong>10 kHz</strong>.{' '}
                      {e.insights[1]}
                    </>
                  )}
                </p>
              </div>
            </div>
            <SignalControls
              key={e.id}
              experiment={e}
              sideband={sideband}
              onSideband={setSideband}
            />
          </div>
        </TabsContent>
        <TabsContent value="theory">
          <ExperimentTheory experiment={e} />
        </TabsContent>
        <TabsContent value="frequency">
          <FrequencyAnalysis experiment={e} sideband={sideband} />
        </TabsContent>
        <TabsContent value="demodulation">
          <DemodulationContent experiment={e} />
        </TabsContent>
      </Tabs>
      <section className="insights-panel">
        <div>
          <span className="insight-icon">
            <Lightbulb size={19} />
          </span>
          <h3>A few things to take away</h3>
          <span className="badge neutral">{e.name}</span>
        </div>
        <ul>
          {e.insights.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
