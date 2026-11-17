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
  if (id === 'vsb') return <VestigialSpectrum compact={compact} />;
  const data =
    id === 'ssb-sc' && sideband === 'LSB' ? lsbSpectrum : spectra[id];
  return (
    <div
      className={`spectrum-plot instrument-surface ${compact ? 'compact' : ''}`}
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
            stroke="var(--scope-grid, #293348)"
            strokeDasharray="3 4"
            vertical={false}
          />
          <XAxis
            dataKey="frequency"
            type="number"
            domain={[8, 12]}
            ticks={[8, 9, 10, 11, 12]}
            tick={{ fontSize: 10, fill: '#8e9db6' }}
            axisLine={false}
            tickLine={false}
            unit="k"
          />
          <YAxis
            domain={[0, 1.2]}
            ticks={[0, 0.5, 1]}
            tick={{ fontSize: 10, fill: '#8e9db6' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#1c263c' }}
            contentStyle={{
              fontSize: 11,
              borderRadius: 6,
              background: '#151d30',
              borderColor: '#354159',
              color: '#e2e8f0',
            }}
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
                fill={p.label === 'Carrier' ? '#fbbf24' : '#22d3ee'}
              />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              style={{ fontSize: 10, fill: '#b2bed0' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <span className="plot-axis-label">Frequency (kHz)</span>
    </div>
  );
}

// A broadband schematic avoids implying an extra tone at the vestige boundary.
// Coordinates are fixed illustration geometry, not a filter or computed spectrum.
function VestigialSpectrum({ compact }: { compact: boolean }) {
  return (
    <div
      className={`spectrum-plot instrument-surface vestigial-spectrum ${compact ? 'compact' : ''}`}
      role="img"
      aria-label="VSB broadband spectrum schematic: suppressed carrier reference at 10 kHz; vestige from 9.75 to 10 kHz, full upper sideband from 10 to 11 kHz. Total bandwidth 1.25 kHz."
    >
      <svg viewBox="0 0 320 225" width="100%" height="100%" aria-hidden="true">
        <g stroke="var(--scope-grid, #293348)" strokeDasharray="3 4">
          {[43, 100, 157].map((y) => (
            <path key={y} d={`M30 ${y}H305`} />
          ))}
        </g>
        <path d="M30 177H305" stroke="#46536b" />
        <path
          d="M150 177L167 66H236V177Z"
          fill="#22d3ee"
          fillOpacity="0.12"
          stroke="#22d3ee"
          strokeWidth="1.5"
        />
        <path d="M167 42V177" stroke="#8697b2" strokeDasharray="3 5" />
        <g fill="#b2bed0" fontSize="9" fontFamily="monospace">
          <text x="10" y="47">
            1
          </text>
          <text x="5" y="104">
            0.5
          </text>
          <text x="15" y="180">
            0
          </text>
          <text x="26" y="195">
            8
          </text>
          <text x="91" y="195">
            9
          </text>
          <text x="161" y="195">
            10
          </text>
          <text x="230" y="195">
            11
          </text>
          <text x="298" y="195">
            12
          </text>
          <text x="204" y="55" fill="#22d3ee">
            USB
          </text>
          <text x="82" y="125" fill="#22d3ee">
            Vestige
          </text>
          <text x="117" y="32">
            Carrier reference
          </text>
        </g>
        <path d="M130 122L154 130" stroke="#22d3ee" strokeWidth="1" />
        <path d="M150 207V215M150 211H236M236 207V215" stroke="#a3c87d" />
      </svg>
      <span className="plot-axis-label">
        Frequency (kHz) · broadband schematic
      </span>
    </div>
  );
}
