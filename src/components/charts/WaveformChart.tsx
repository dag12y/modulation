import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Maximize2 } from 'lucide-react';
import { waveformData } from '@/data/mockSignals';
import type { SignalKey } from '@/data/mockSignals';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
export function WavePlot({
  signal = 'message',
  color = '#38bdf8',
  overlay = false,
  tall = false,
  visible = { message: true, carrier: true, modulated: true },
}: {
  signal?: SignalKey;
  color?: string;
  overlay?: boolean;
  tall?: boolean;
  visible?: { message: boolean; carrier: boolean; modulated: boolean };
}) {
  return (
    <div
      className={`wave-plot ${tall ? 'tall' : ''}`}
      role="img"
      aria-label={`${overlay ? 'Overlaid message, carrier, and modulated' : signal} static waveform, amplitude in volts over 4 milliseconds`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={waveformData}
          margin={{ top: 8, right: 12, left: -23, bottom: 2 }}
        >
          <CartesianGrid
            stroke="var(--scope-grid, #293348)"
            strokeDasharray="2 4"
            vertical={true}
          />
          <XAxis
            dataKey="time"
            type="number"
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            tick={{ fontSize: 10, fill: '#8e9db6' }}
            axisLine={false}
            tickLine={false}
            unit=" ms"
          />
          <YAxis
            domain={[-2, 2]}
            ticks={[-2, 0, 2]}
            tick={{ fontSize: 10, fill: '#8e9db6' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              borderRadius: 8,
              borderColor: '#354159',
              background: '#151d30',
              color: '#e2e8f0',
            }}
            labelFormatter={(v) => `${v} ms`}
          />
          {overlay && (
            <>
              <Line
                hide={!visible.message}
                name="Message (V)"
                dataKey="message"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                hide={!visible.carrier}
                name="Carrier (V)"
                dataKey="carrier"
                stroke="#a78bfa"
                strokeWidth={1}
                opacity={0.4}
                dot={false}
                isAnimationActive={false}
              />
            </>
          )}
          <Line
            hide={overlay && !visible.modulated}
            name="Amplitude (V)"
            dataKey={signal}
            stroke={color}
            strokeWidth={1.65}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function WaveformChart({
  label,
  symbol,
  signal,
  color,
  overlay = false,
}: {
  label: string;
  symbol: string;
  signal: SignalKey;
  color: string;
  overlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="signal-row instrument-surface">
      <div className="signal-heading">
        <span>
          <i style={{ background: color }} />
          {label}
          <em>{symbol}</em>
        </span>
        <div>
          <span className="axis-unit">Amplitude (V)</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Expand ${label}`}
            onClick={() => setOpen(true)}
          >
            <Maximize2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled
            aria-label={`Download ${label} coming soon`}
            title="Download coming soon"
          >
            <Download size={12} />
          </Button>
        </div>
      </div>
      <WavePlot signal={signal} color={color} overlay={overlay} />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description="Fixed demonstration data · Amplitude (V) vs. Time (ms)"
        className="scope-dialog instrument-surface"
      >
        <WavePlot signal={signal} color={color} overlay={overlay} tall />
      </Dialog>
    </section>
  );
}
