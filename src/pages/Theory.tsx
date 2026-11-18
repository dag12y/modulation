import { ArrowUpRight, BookOpen, Lightbulb } from 'lucide-react';
import { experiments, theoryTopics, variables } from '@/data/experiments';
import type { ExperimentData } from '@/data/experiments';
import { Equation } from '@/components/Equation';
import { Link } from '@/app/router';
export function ExperimentTheory({
  experiment: e,
}: {
  experiment: ExperimentData;
}) {
  return (
    <div className="theory-layout">
      <section className="card equation-card">
        <span className="eyebrow">THE MATHEMATICAL MODEL</span>
        <h2>{e.name} signal representation</h2>
        <p className="muted">
          {e.id === 'vsb'
            ? 'A filter-based description for a general message signal.'
            : 'An ideal, single-tone illustration with message frequency fₘ and carrier frequency f꜀.'}
        </p>
        {e.equations.map((eq) => (
          <Equation key={eq} math={eq} block />
        ))}
        {e.id === 'ssb-sc' && (
          <>
            <Equation
              math={String.raw`\hat{m}(t)=\frac{1}{\pi}\int_{-\infty}^{\infty}\frac{m(\tau)}{t-\tau}\,d\tau`}
              block
            />
            <p className="muted">
              Minus (−) selects the Upper Sideband (USB) and plus (+) selects
              the Lower Sideband (LSB). In the frequency domain, the Hilbert
              transform has unity gain |H(f)| = 1 and a ±π/2 phase shift.
            </p>
          </>
        )}
        {e.id === 'vsb' && (
          <p className="muted">
            * denotes convolution. Hᵥₛᵦ(f) is the asymmetric filter response.
            This example uses suppressed carrier; VSB may also retain a carrier.
          </p>
        )}
        <div className="educational-note">
          <Lightbulb size={18} />
          <span>{e.efficiency}</span>
        </div>
        <div className="theory-questions">
          {(e.id === 'ssb-sc'
            ? [
                {
                  question: 'Phase discrimination method (Hilbert)',
                  answer:
                    'Splits the signal into an in-phase path m(t)cos(2πfct) and a 90° quadrature path m̂(t)sin(2πfct) using a wideband Hilbert phase-shifter, then subtracts (USB) or adds (LSB) them.',
                },
                {
                  question: 'Frequency discrimination method (Filter)',
                  answer:
                    'Generates DSB-SC with a product modulator and removes the unwanted sideband using a band-pass filter. Practical filters require a baseband energy gap (fa to fb, such as 300–3400 Hz voice) for the filter transition band.',
                },
                {
                  question: 'Coherent demodulation',
                  answer:
                    'Multiplies the received wave s(t) by a synchronized local oscillator A′c cos(2πfct + φ) to form v(t), then passes v(t) through a low-pass filter to recover m(t).',
                },
                {
                  question: 'Efficiency, applications & practical limits',
                  answer:
                    'Achieves BW = BWm and 100% power efficiency (used in HF/VHF aviation, marine, amateur radio, and satellite links), but demands strict phase accuracy and can suffer group delay or amplitude distortion from sharp filters.',
                },
              ]
            : [
                {
                  question: 'What happens to the carrier?',
                  answer:
                    e.carrier.replace('*', '') +
                    '. The carrier provides the frequency reference.',
                },
                {
                  question: 'Which sidebands are transmitted?',
                  answer:
                    e.sidebands +
                    '. The message information is carried in the sidebands.',
                },
                {
                  question: 'How much bandwidth is needed?',
                  answer: `${e.bandwidth} in this example, for a message bandwidth of 1 kHz.`,
                },
                {
                  question: 'What makes it different?',
                  answer: e.insights[e.insights.length - 1],
                },
              ]
          ).map((n) => (
            <div key={n.question}>
              <h3>{n.question}</h3>
              <p>{n.answer}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="card variable-card">
        <h2>Variable reference</h2>
        <p className="muted">A quick guide to the notation.</p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Meaning / unit</th>
              </tr>
            </thead>
            <tbody>
              {variables.map(([symbol, meaning, unit]) => (
                <tr key={symbol}>
                  <td>
                    <Equation math={symbol} />
                  </td>
                  <td>
                    {meaning}
                    <small>{unit}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export function Theory() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div className="eyebrow">
          <BookOpen size={14} /> THE REFERENCE LIBRARY
        </div>
        <h1>Understand the signal.</h1>
        <p>
          The fundamentals, without the friction. Build your intuition one idea
          at a time.
        </p>
      </div>
      <div className="topic-grid">
        {theoryTopics.map((t, i) => (
          <article className="card topic-card" key={t.title}>
            <span className="topic-number">0{i + 1}</span>
            <span className="eyebrow">{t.label}</span>
            <h2>{t.title}</h2>
            <p>{t.text}</p>
          </article>
        ))}
      </div>
      <div className="section-heading library-heading">
        <div>
          <span className="eyebrow">EQUATION NOTEBOOK</span>
          <h2>The four modulation models</h2>
        </div>
        <span className="badge neutral">IDEAL SIGNAL REPRESENTATIONS</span>
      </div>
      {experiments.map((e) => (
        <section className="card library-equation" key={e.id}>
          <div>
            <span className="eyebrow">EXPERIMENT {e.number}</span>
            <h2>{e.name}</h2>
            <p>{e.fullName}</p>
            <Link className="text-link" to={`/experiments/${e.id}`}>
              Open experiment <ArrowUpRight size={14} />
            </Link>
          </div>
          <div>
            {e.equations.map((eq) => (
              <Equation key={eq} math={eq} block />
            ))}
          </div>
        </section>
      ))}
      <section className="card variable-card">
        <h2>Reading the notation</h2>
        <div className="variable-grid">
          {variables.map(([s, m, u]) => (
            <div key={s}>
              <Equation math={s} />
              <span>
                {m}
                <small>{u}</small>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
