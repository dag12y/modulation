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

export interface WaveVisibleMap {
  message: boolean;
  carrier: boolean;
  modulated: boolean;
  hilbert?: boolean;
  envelope?: boolean;
}

export function WavePlot({
  signal = 'message',
  color = '#38bdf8',
  overlay = false,
  tall = false,
  showTimeAxis = true,
  visible = { message: true, carrier: true, modulated: true },
  data,
  yDomain = [-2, 2],
  referenceKey,
  referenceName = 'Original m(t)',
  referenceColor = '#94a3b8',
}: {
  signal?: SignalKey | string;
  color?: string;
  overlay?: boolean;
  tall?: boolean;
  showTimeAxis?: boolean;
  visible?: WaveVisibleMap;
  data?: ReadonlyArray<Record<string, number>>;
  yDomain?: [number, number];
  referenceKey?: string;
  referenceName?: string;
  referenceColor?: string;
}) {
  const chartData = (data ?? waveformData) as Record<string, number>[];
  const maxAbs = Math.max(
    2,
    Math.ceil(Math.max(Math.abs(yDomain[0]), Math.abs(yDomain[1]))),
  );
  const ticks = [-maxAbs, 0, maxAbs];
  const isLive = Boolean(data);

  return (
    <div
      className={`wave-plot ${tall ? 'tall' : ''}`}
      role="img"
      aria-label={`${overlay ? 'Overlaid message, carrier, and modulated' : signal} ${isLive ? 'simulated' : 'static'} waveform, amplitude in volts over 4 milliseconds`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
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
            hide={!showTimeAxis}
            unit=" ms"
          />
          <YAxis
            domain={[-maxAbs, maxAbs]}
            ticks={ticks}
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
                name="Message m(t) (V)"
                dataKey="message"
                stroke="#38bdf8"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              {visible.hilbert !== undefined && (
                <Line
                  hide={!visible.hilbert}
                  name="Hilbert m̂(t) (V)"
                  dataKey="hilbert"
                  stroke="#fbbf24"
                  strokeWidth={1.35}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <Line
                hide={!visible.carrier}
                name="Carrier c(t) (V)"
                dataKey="carrier"
                stroke="#a78bfa"
                strokeWidth={1}
                opacity={0.4}
                dot={false}
                isAnimationActive={false}
              />
              {visible.envelope !== undefined && (
                <Line
                  hide={!visible.envelope}
                  name="Envelope E(t) (V)"
                  dataKey="envelope"
                  stroke="#f472b6"
                  strokeWidth={1.25}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </>
          )}
          {referenceKey && (
            <Line
              name={referenceName}
              dataKey={referenceKey}
              stroke={referenceColor}
              strokeWidth={1.3}
              strokeDasharray="4 3"
              opacity={0.75}
              dot={false}
              isAnimationActive={false}
            />
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
  data,
  yDomain,
  referenceKey,
  referenceName,
  referenceColor,
  onDownload,
}: {
  label: string;
  symbol: string;
  signal: SignalKey | string;
  color: string;
  overlay?: boolean;
  data?: ReadonlyArray<Record<string, number>>;
  yDomain?: [number, number];
  referenceKey?: string;
  referenceName?: string;
  referenceColor?: string;
  onDownload?: () => void;
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
            disabled={!onDownload}
            onClick={onDownload}
            aria-label={
              onDownload
                ? `Download ${label} CSV`
                : `Download ${label} coming soon`
            }
            title={
              onDownload ? `Download ${label} CSV` : 'Download coming soon'
            }
          >
            <Download size={12} />
          </Button>
        </div>
      </div>
      <WavePlot
        signal={signal}
        color={color}
        overlay={overlay}
        data={data}
        yDomain={yDomain}
        referenceKey={referenceKey}
        referenceName={referenceName}
        referenceColor={referenceColor}
      />
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={
          data
            ? 'Live simulated waveform · Amplitude (V) vs. Time (ms)'
            : 'Fixed demonstration data · Amplitude (V) vs. Time (ms)'
        }
        className="scope-dialog instrument-surface"
      >
        <WavePlot
          signal={signal}
          color={color}
          overlay={overlay}
          data={data}
          yDomain={yDomain}
          referenceKey={referenceKey}
          referenceName={referenceName}
          referenceColor={referenceColor}
          tall
        />
      </Dialog>
    </section>
  );
}
