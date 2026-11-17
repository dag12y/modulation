import { ArrowUpRight, ChartNoAxesCombined, Lightbulb } from 'lucide-react';
import { experiments } from '@/data/experiments';
import { SpectrumChart } from '@/components/charts/SpectrumChart';
import { Link } from '@/app/router';
export function Comparison() {
  return (
    <div className="page-enter comparison-workspace">
      <div className="page-heading">
        <div className="eyebrow">
          <ChartNoAxesCombined size={14} /> SIDE BY SIDE
        </div>
        <h1>Same message. Different approaches.</h1>
        <p>
          Compare how four modulation techniques trade bandwidth, power, and
          receiver complexity.
        </p>
      </div>
      <div className="section-heading library-heading">
        <div>
          <span className="eyebrow">A VISUAL COMPARISON</span>
          <h2>Where the information lives</h2>
          <p>
            Fixed spectra with the same 10 kHz carrier reference. SSB shows USB.
          </p>
        </div>
      </div>
      <div className="spectrum-comparison">
        {experiments.map((e) => (
          <section
            className="card comparison-instrument instrument-surface"
            key={e.id}
          >
            <div className="spectrum-mini-heading">
              <span className="eyebrow">EXPERIMENT {e.number}</span>
              <Link to={`/experiments/${e.id}`} aria-label={`Open ${e.name}`}>
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <h3>{e.name}</h3>
            <SpectrumChart id={e.id} compact />
            <div className="spectrum-summary">
              {e.sidebands}
              <span>{e.bandwidth}</span>
            </div>
            <div className="comparison-bandwidth">
              <span
                style={{
                  width: `${e.id === 'ssb-sc' ? 50 : e.id === 'vsb' ? 62.5 : 100}%`,
                }}
              />
            </div>
            <div className="comparison-carrier">Carrier: {e.carrier}</div>
          </section>
        ))}
      </div>
      <section className="card comparison-card">
        <div className="card-heading">
          <div>
            <h2>The modulation landscape</h2>
            <p>B = message bandwidth · Bᵥ = vestigial bandwidth</p>
          </div>
          <span className="badge">04 TECHNIQUES</span>
        </div>
        <div className="table-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Modulation type</th>
                <th>Carrier</th>
                <th>Sidebands</th>
                <th>Bandwidth</th>
                <th>Power efficiency</th>
                <th>Demodulation</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={`/experiments/${e.id}`}>
                      <span
                        style={{ background: e.color }}
                        className="table-dot"
                      />
                      <strong>{e.name}</strong>
                      <ArrowUpRight size={12} />
                    </Link>
                    <small>{e.fullName}</small>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${e.id === 'dsb-fc' ? 'transmitted' : ''}`}
                    >
                      {e.carrier}
                    </span>
                  </td>
                  <td>{e.sidebands}</td>
                  <td>
                    <strong>
                      {e.id === 'vsb'
                        ? 'B + Bᵥ'
                        : e.id === 'ssb-sc'
                          ? 'B'
                          : '2B'}
                    </strong>
                  </td>
                  <td>{e.efficiency}</td>
                  <td>{e.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          * VSB has several variants. The example here uses a suppressed carrier
          and coherent detection.
        </p>
      </section>
      <div className="insights-panel comparison-insight">
        <Lightbulb size={22} />
        <div>
          <h3>There is no single best modulation technique.</h3>
          <p>
            DSB-FC favors simple receivers. SSB conserves spectrum. DSB-SC saves
            carrier power. VSB balances bandwidth with practical filtering.
          </p>
        </div>
      </div>
    </div>
  );
}
