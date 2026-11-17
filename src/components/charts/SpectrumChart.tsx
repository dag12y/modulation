import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExperimentId } from '@/data/experiments';
import { lsbSpectrum, spectra } from '@/data/mockSignals';
export function SpectrumChart({
  id = 'dsb-fc',
  sideband = 'USB',
  compact = false,
}: {
  id?: ExperimentId;
  sideband?: string;
  compact?: boolean;
}) {
  const data =
    id === 'ssb-sc' && sideband === 'LSB' ? lsbSpectrum : spectra[id];
  return (
    <div
      className={`spectrum-plot ${compact ? 'compact' : ''}`}
      role="img"
      aria-label={`${id} illustrative positive-frequency magnitude spectrum. ${data
        .filter((d) => d.amplitude > 0)
        .map((d) => `${d.label} at ${d.frequency} kHz`)
        .join(', ')}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barSize={5}
          margin={{ top: 28, right: 14, left: -20, bottom: 6 }}
        >
          <CartesianGrid
            stroke="#e8edf3"
            strokeDasharray="3 4"
            vertical={false}
          />
          <XAxis
            dataKey="frequency"
            type="number"
            domain={[8, 12]}
            ticks={[8, 9, 10, 11, 12]}
            tick={{ fontSize: 10, fill: '#8894a5' }}
            axisLine={false}
            tickLine={false}
            unit="k"
          />
          <YAxis
            domain={[0, 1.2]}
            ticks={[0, 0.5, 1]}
            tick={{ fontSize: 10, fill: '#8894a5' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            labelFormatter={(v) => `${v} kHz`}
          />
          <Bar
            dataKey="amplitude"
            name="Relative magnitude"
            isAnimationActive={false}
            radius={[3, 3, 0, 0]}
          >
            {data.map((p, i) => (
              <Cell
                key={i}
                fill={p.label === 'Carrier' ? '#8ab329' : '#6b84e6'}
              />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              style={{ fontSize: 10, fill: '#64748b' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <span className="plot-axis-label">Frequency (kHz)</span>
    </div>
  );
}
