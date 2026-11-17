import {
  ArrowUpRight,
  CircleDot,
  Gauge,
  Radio,
  ScanLine,
  Zap,
} from 'lucide-react';
import type { ExperimentData } from '@/data/experiments';
export function MetricsPanel({ experiment }: { experiment: ExperimentData }) {
  const metrics = [
    {
      label: 'Modulation index',
      value: experiment.id === 'dsb-fc' ? '0.70' : '—',
      unit: experiment.id === 'dsb-fc' ? '70% depth' : 'Not applicable',
      icon: Gauge,
    },
    {
      label: 'Signal bandwidth',
      value: experiment.bandwidth.split(' ')[0],
      unit: 'kHz',
      icon: ScanLine,
    },
    { label: 'Carrier frequency', value: '10', unit: 'kHz', icon: Radio },
    {
      label: 'Sideband frequencies',
      value:
        experiment.id === 'ssb-sc'
          ? '11'
          : experiment.id === 'vsb'
            ? '9.75 / 11'
            : '9 / 11',
      unit: 'kHz · example',
      icon: CircleDot,
    },
    {
      label: 'Carrier status',
      value: experiment.carrier,
      unit:
        experiment.id === 'dsb-fc'
          ? 'Conventional AM'
          : 'Example configuration',
      icon: Zap,
    },
  ];
  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <div
          className={`metric-card ${i === 1 ? 'highlight' : ''}`}
          key={m.label}
        >
          <div>
            <m.icon size={15} />
            <span>{m.label}</span>
            {i === 1 && <ArrowUpRight size={13} />}
          </div>
          <strong>
            {m.value}
            <small>{m.unit === 'kHz' ? 'kHz' : ''}</small>
          </strong>
          <span className="metric-note">
            {i === 2
              ? 'Carrier reference · fixed example'
              : m.unit === 'kHz'
                ? experiment.id === 'ssb-sc'
                  ? 'One message bandwidth'
                  : experiment.id === 'vsb'
                    ? 'Message + vestigial bandwidth'
                    : 'Twice message bandwidth'
                : m.unit}
          </span>
        </div>
      ))}
    </div>
  );
}
