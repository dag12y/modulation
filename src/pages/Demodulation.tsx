import { Info, Radio, Waves } from 'lucide-react';
import { FlowDiagram } from '@/components/FlowDiagram';
import { WaveformChart } from '@/components/charts/WaveformChart';
import { experiments } from '@/data/experiments';
import type { ExperimentData } from '@/data/experiments';
import { signalKeys } from '@/data/mockSignals';
export function DemodulationContent({
  experiment: e = experiments[0],
}: {
  experiment?: ExperimentData;
}) {
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
            {e.id === 'dsb-fc'
              ? 'An envelope detector follows the outer shape of the AM signal. A low-pass stage smooths the result to reveal the original message. This works when the carrier is strong and the signal is not overmodulated.'
              : 'A synchronized local oscillator provides a carrier reference. Mixing and low-pass filtering can then recover the message. Correct frequency and phase alignment are essential.'}
          </p>
          <div className="method-detail">
            <strong>What to remember</strong>
            <p>
              {e.id === 'dsb-fc'
                ? 'Envelope detection is simple, but it depends on a suitable modulation index and adequate carrier amplitude.'
                : 'Coherent detection improves flexibility but requires a synchronized reference. VSB also needs a suitable filter response for distortion-free recovery.'}
            </p>
          </div>
          <div className="educational-note">
            <Info size={17} />
            <span>
              Receiver processing and recovered-signal measurements arrive in
              the simulation phase.
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
          <Radio size={14} /> THE RECEIVER SIDE
        </div>
        <h1>Bring the message home.</h1>
        <p>
          See how a modulated signal becomes information again. A static guide
          to the receiver chain.
        </p>
      </div>
      <DemodulationContent />
    </div>
  );
}
