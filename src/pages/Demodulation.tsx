import { ArrowRight, Info, Radio, Waves } from 'lucide-react';
import { FlowDiagram } from '@/components/FlowDiagram';
import { WaveformChart } from '@/components/charts/WaveformChart';
import { EnvelopeDetectorLab } from '@/components/simulation/EnvelopeDetectorLab';
import { experiments } from '@/data/experiments';
import type { ExperimentData } from '@/data/experiments';
import { signalKeys } from '@/data/mockSignals';
import { Link } from '@/app/router';
export function DemodulationContent({
  experiment: e = experiments[0],
}: {
  experiment?: ExperimentData;
}) {
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
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div className="eyebrow">
          <Radio size={14} /> CHAPTER 2 · CONVENTIONAL AM DEMODULATION
        </div>
        <h1>Bring the message home.</h1>
        <p>
          Simulate conventional AM (DSB-LC) envelope detection end to end:
          half-wave rectification, RC low-pass smoothing under{' '}
          <code>1/fc ≪ RC ≪ 1/W</code>, and over-modulation distortion when{' '}
          <code>μ &gt; 1</code>.
        </p>
      </div>
      <DemodulationContent />
    </div>
  );
}
