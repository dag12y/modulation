import { ArrowLeft, Radio } from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
import { Link } from '@/app/router';
export function ExperimentHeader({
  experiment: e,
}: {
  experiment: ExperimentData;
}) {
  return (
    <>
      <Link className="back-link" to="/experiments">
        {' '}
        <ArrowLeft size={13} /> All experiments
      </Link>
      <div className="page-heading experiment-heading">
        <div>
          <div className="eyebrow">
            EXPERIMENT {e.number}
            <span className="badge">
              <Radio size={11} /> ANALOG MODULATION
            </span>
          </div>
          <h1>
            {e.name}
            <span className="title-slash">/</span>
            <span className="full-title">{e.fullName}</span>
          </h1>
          <p>{e.description}</p>
        </div>
        <span className="experiment-number">{e.number}</span>
      </div>
      <div className="characteristics">
        <span>
          Carrier <strong>{e.carrier}</strong>
        </span>
        <span>
          Sidebands <strong>{e.sidebands}</strong>
        </span>
        <span>
          Bandwidth{' '}
          <strong>
            {e.id === 'ssb-sc' ? 'B' : e.id === 'vsb' ? 'B + Bᵥ' : '2B'}
          </strong>
        </span>
        <span className="mock-label">
          Fixed demonstration · fₘ = 1 kHz, f꜀ = 10 kHz
        </span>
      </div>
    </>
  );
}
