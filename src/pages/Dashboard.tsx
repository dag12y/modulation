import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { Link } from '@/app/router';
import { experiments } from '@/data/experiments';
import { WavePlot } from '@/components/charts/WaveformChart';
import { SpectrumChart } from '@/components/charts/SpectrumChart';
import { FlowDiagram } from '@/components/FlowDiagram';
export function Dashboard() {
  return (
    <div className="studio-dashboard page-enter">
      <section className="studio-intro">
        <div className="intro-copy">
          <span className="eyebrow">AM STUDIO / HYBRID INSTRUMENT STUDIO</span>
          <h1>
            Find the signal.
            <br />
            <em>Understand the science.</em>
          </h1>
          <p>
            A hands-on perspective on amplitude modulation. Explore the
            waveforms, inspect the spectrum, and connect what you see to the
            mathematics.
          </p>
          <div className="intro-actions">
            <Link className="button button-primary" to="/experiments/dsb-fc">
              Enter the laboratory <ArrowRight size={16} />
            </Link>
            <Link className="text-link" to="/theory">
              <BookOpen size={15} /> Read the field notes
            </Link>
          </div>
          <span className="intro-edition">
            EDUCATIONAL EDITION <b>02</b> / STATIC UI PREVIEW
          </span>
        </div>
        <div className="intro-instrument instrument-surface">
          <div className="intro-instrument-header">
            <span>
              <i /> SIGNAL STUDY 001
            </span>
            <span>DSB-FC</span>
          </div>
          <div className="intro-frequency">
            <span>
              10.00<small>kHz</small>
            </span>
            <p>CARRIER REFERENCE</p>
          </div>
          <WavePlot signal="modulated" color="#a3e635" tall />
          <div className="intro-instrument-footer">
            <span>m(t) × c(t)</span>
            <span>Information, carried.</span>
          </div>
        </div>
      </section>
      <section className="experiment-library">
        <div className="studio-section-heading">
          <div>
            <span className="eyebrow">FOUR WAYS TO CARRY AN IDEA</span>
            <h2>Your experiment bench</h2>
          </div>
          <Link className="text-link" to="/comparison">
            Compare all techniques <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="studio-experiments">
          {experiments.map((e) => (
            <Link
              to={`/experiments/${e.id}`}
              className="studio-experiment"
              key={e.id}
            >
              <div className="studio-experiment-label">
                <span>EXPERIMENT / {e.number}</span>
                <ArrowUpRight size={17} />
              </div>
              <div className="experiment-art instrument-surface">
                <SpectrumChart id={e.id} compact />
              </div>
              <h3>
                {e.name}
                <small>
                  {e.id === 'ssb-sc' ? 'B' : e.id === 'vsb' ? 'B + Bᵥ' : '2B'}
                </small>
              </h3>
              <h4>{e.fullName}</h4>
              <p>
                {e.id === 'dsb-fc'
                  ? 'Start with the classic. Two sidebands and a carrier you can follow.'
                  : e.id === 'dsb-sc'
                    ? 'Remove the carrier. Put transmitted power into the information.'
                    : e.id === 'ssb-sc'
                      ? 'Keep one sideband. Make more room in the spectrum.'
                      : 'One sideband, plus a vestige. Explore the art of compromise.'}
              </p>
              <span className="experiment-entry">
                Open instrument <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="studio-principle">
        <div>
          <span className="eyebrow">THE FUNDAMENTAL IDEA</span>
          <h2>
            A message meets
            <br />a higher frequency.
          </h2>
          <p>
            Amplitude modulation varies a carrier’s amplitude to convey
            information. The message moves into a frequency band suited to
            transmission.
          </p>
          <Link to="/theory" className="text-link">
            Follow the mathematics <ArrowRight size={14} />
          </Link>
        </div>
        <div className="studio-flow">
          <FlowDiagram />
          <p>Message → modulation → transmission → recovery</p>
        </div>
      </section>
    </div>
  );
}
