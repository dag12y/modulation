import { Calculator, Info, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Equation } from '@/components/Equation';
export function Calculations() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div className="eyebrow">
          <Calculator size={14} /> THE ENGINEERING NOTEBOOK
        </div>
        <h1>A little clarity in the numbers.</h1>
        <p>
          A preview of the calculation workspace. Inputs are editable; example
          results remain fixed.
        </p>
      </div>
      <div className="calculator-grid">
        <section className="card calculator-form">
          <div className="card-heading">
            <h2>Signal parameters</h2>
            <span className="badge neutral">UI PREVIEW</span>
          </div>
          <label>
            Modulation technique
            <select defaultValue="DSB-FC">
              <option>DSB-FC</option>
              <option>DSB-SC</option>
              <option>SSB-SC</option>
              <option>VSB</option>
            </select>
          </label>
          {[
            { label: 'Message frequency', value: '1', unit: 'kHz' },
            { label: 'Carrier frequency', value: '10', unit: 'kHz' },
            { label: 'Message amplitude', value: '0.7', unit: 'V' },
            { label: 'Carrier amplitude', value: '1', unit: 'V' },
            { label: 'Load resistance', value: '50', unit: 'Ω' },
          ].map((f) => (
            <label key={f.label}>
              {f.label}
              <div className="input-unit">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  defaultValue={f.value}
                />
                <span>{f.unit}</span>
              </div>
            </label>
          ))}
          <Button disabled>
            <LockKeyhole size={15} /> Calculate · Coming soon
          </Button>
          <div className="educational-note">
            <Info size={15} />
            <span>Calculation logic is not connected.</span>
          </div>
        </section>
        <section>
          <div className="static-result-heading">
            <h2>Worked example</h2>
            <span className="badge">FIXED DSB-FC VALUES</span>
          </div>
          <div className="calculation-results">
            {[
              {
                label: 'Modulation index',
                value: '0.70',
                unit: '70% modulation',
                formula: String.raw`\mu=\frac{A_m}{A_c}`,
              },
              {
                label: 'Transmission bandwidth',
                value: '2 kHz',
                unit: 'Two sidebands',
                formula: String.raw`B_T=2B`,
              },
              {
                label: 'Carrier power',
                value: '10 mW',
                unit: 'A꜀ = 1 V peak, R = 50 Ω',
                formula: String.raw`P_c=\frac{A_c^2}{2R}`,
              },
              {
                label: 'Total transmitted power',
                value: '12.45 mW',
                unit: 'Single-tone AM, μ = 0.7',
                formula: String.raw`P_T=P_c\left(1+\frac{\mu^2}{2}\right)`,
              },
            ].map((r) => (
              <article className="card result-card" key={r.label}>
                <span className="muted">{r.label}</span>
                <strong>{r.value}</strong>
                <p>{r.unit}</p>
                <Equation math={r.formula} />
              </article>
            ))}
          </div>
          <div className="card calculator-note">
            <h3>Learn the relationship, then explore it.</h3>
            <p>
              These examples show how a signal's parameters relate to its
              bandwidth and power. Editable inputs do not update these values in
              this preview.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
