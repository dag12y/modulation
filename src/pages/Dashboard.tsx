import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  FlaskConical,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/app/router';
import { Button } from '@/components/ui/button';
import { experiments } from '@/data/experiments';
import { WavePlot } from '@/components/charts/WaveformChart';
import { signalKeys } from '@/data/mockSignals';
import { FlowDiagram } from '@/components/FlowDiagram';
export function Dashboard() {
  return (
    <div className="dashboard page-enter">
      <div className="dashboard-greeting">
        <span className="eyebrow">
          <span className="live-dot" /> YOUR VIRTUAL COMMUNICATIONS LAB
        </span>
        <span className="quiet-text">
          An idea. A carrier. Endless possibilities.
        </span>
      </div>
      <section className="hero">
        <div className="hero-grid-pattern" />
        <div className="hero-copy">
          <span className="badge">
            <Radio size={12} /> ANALOG COMMUNICATIONS
          </span>
          <h1>
            Big ideas.
            <br />
            Carried by <span>small waves.</span>
          </h1>
          <h2>Interactive Amplitude Modulation Laboratory</h2>
          <p>
            Explore, visualize, and understand amplitude modulation through
            interactive signal analysis and mathematical insight.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link to="/experiments/dsb-fc">
                Explore Experiments <ArrowRight size={16} />
              </Link>
            </Button>
            <Link to="/theory" className="text-link">
              <BookOpen size={15} /> Start with the theory
            </Link>
          </div>
          <div className="hero-caption">
            <span /> A space to explore. Built to help you understand.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="wave-art-top">
            <span>THE ANATOMY OF A SIGNAL</span>
            <span>FIG. 001</span>
          </div>
          <div className="hero-wave-main">
            <WavePlot signal="modulated" color="#789c27" tall />
          </div>
          <div className="art-carrier-label">
            <span className="art-dot" /> Carrier + message{' '}
            <ArrowRight size={12} /> possibility
          </div>
          <div className="hero-art-formula">
            s(t) = A꜀ [1 + μm(t)] cos(2πf꜀t)
          </div>
        </div>
      </section>
      <section className="experiments-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LEARN BY EXPLORING</span>
            <h2>
              Choose your experiment<span className="count-badge">04</span>
            </h2>
            <p>
              Four approaches. One fundamental idea. Find out what makes each
              signal different.
            </p>
          </div>
          <Link to="/comparison" className="text-link">
            Compare techniques <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="experiment-cards">
          {experiments.map((e) => (
            <Link
              to={`/experiments/${e.id}`}
              className="experiment-card"
              key={e.id}
            >
              <div className="experiment-card-top">
                <span className="experiment-card-number">
                  EXPERIMENT {e.number}
                </span>
                <ArrowUpRight size={17} />
              </div>
              <div className="mini-wave">
                <WavePlot signal={signalKeys[e.id]} color={e.color} />
              </div>
              <h3>
                {e.name}
                <span style={{ background: e.color }} />
              </h3>
              <h4>{e.fullName}</h4>
              <p>
                {e.id === 'dsb-fc'
                  ? 'The classic. A carrier, two sidebands, and the foundations of AM.'
                  : e.id === 'dsb-sc'
                    ? 'Keep the message. Suppress the carrier. Make every watt count.'
                    : e.id === 'ssb-sc'
                      ? 'One sideband is all you need. Discover a more efficient spectrum.'
                      : 'One full sideband, a little of the other. A practical balance.'}
              </p>
              <div className="card-characteristics">
                <span>{e.carrier.replace('*', '')} carrier</span>
                <span>
                  {e.id === 'vsb' ? 'B + Bᵥ' : e.id === 'ssb-sc' ? 'B' : '2B'}{' '}
                  bandwidth
                </span>
              </div>
              <div className="open-experiment">
                Open Experiment <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="process-section card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM INFORMATION TO TRANSMISSION</span>
            <h2>A message, on a higher frequency.</h2>
            <p>Modulation gives your message a carrier. Here's the journey.</p>
          </div>
          <span className="badge neutral">THE FUNDAMENTALS</span>
        </div>
        <FlowDiagram />
        <div className="process-note">
          <Sparkles size={15} />
          <span>
            The message contains the information. The carrier helps it travel.
          </span>
          <Link to="/theory">
            Understand the process <ArrowRight size={13} />
          </Link>
        </div>
      </section>
      <section className="dashboard-bottom">
        <div>
          <span className="bottom-icon">
            <BookOpen size={21} />
          </span>
          <div>
            <h3>Meet the math behind the waves.</h3>
            <p>Clear equations. Practical explanations. No guesswork.</p>
          </div>
          <Link to="/theory" aria-label="Explore theory library">
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <div>
          <span className="bottom-icon">
            <FlaskConical size={21} />
          </span>
          <div>
            <h3>A laboratory in the making.</h3>
            <p>You're exploring the UI preview. Live simulation comes next.</p>
          </div>
          <AudioLines size={22} />
        </div>
      </section>
      <div className="dashboard-end">
        <ArrowDown size={12} /> Follow your curiosity. Start with Experiment 01.
      </div>
    </div>
  );
}
