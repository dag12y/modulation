import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { EnvelopeSample } from '@/lib/envelopeDetector';

interface PlotChannelProps {
  title: string;
  symbol: string;
  subtitle: string;
  samples: EnvelopeSample[];
  windowMs: number;
  yMin: number;
  yMax: number;
  height: number;
  hoverIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
  showTimeTicks?: boolean;
  drawTraces: (
    ctx: CanvasRenderingContext2D,
    toX: (t: number) => number,
    toY: (v: number) => number,
    plotBounds: { left: number; top: number; width: number; height: number },
  ) => void;
  legend: { label: string; color: string; dashed?: boolean }[];
}

function niceTicks(yMin: number, yMax: number): number[] {
  const span = yMax - yMin;
  if (span <= 0) return [0];
  const rawStep = span / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step =
    norm <= 1.2 ? mag : norm <= 2.5 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag;
  const ticks: number[] = [];
  const start = Math.ceil(yMin / step) * step;
  for (let v = start; v <= yMax + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(2)));
  }
  if (!ticks.includes(0) && yMin < 0 && yMax > 0) ticks.push(0);
  return ticks.sort((a, b) => a - b);
}

function PlotCanvasRow({
  title,
  symbol,
  subtitle,
  samples,
  windowMs,
  yMin,
  yMax,
  height,
  hoverIndex,
  onHoverIndex,
  showTimeTicks = false,
  drawTraces,
  legend,
}: PlotChannelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (nextWidth && nextWidth > 40) {
        setWidth(Math.round(nextWidth));
      }
    });
    observer.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width) || 720);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr =
      typeof window !== 'undefined'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padLeft = 42;
    const padRight = 14;
    const padTop = 10;
    const padBottom = showTimeTicks ? 24 : 10;
    const plotW = Math.max(40, width - padLeft - padRight);
    const plotH = Math.max(40, height - padTop - padBottom);

    const toX = (t: number) => padLeft + (t / windowMs) * plotW;
    const toY = (v: number) =>
      padTop + ((yMax - v) / Math.max(yMax - yMin, 1e-6)) * plotH;

    // Subtle gridlines
    ctx.strokeStyle = '#253147';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const xTickCount = windowMs <= 2 ? 4 : 4;
    for (let i = 0; i <= xTickCount; i++) {
      const tVal = (windowMs / xTickCount) * i;
      const x = Math.round(toX(tVal)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
      ctx.stroke();

      if (showTimeTicks) {
        ctx.fillStyle = '#8e9db6';
        ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign =
          i === 0 ? 'left' : i === xTickCount ? 'right' : 'center';
        ctx.fillText(
          `${tVal.toFixed(windowMs <= 2 ? 1 : 0)} ms`,
          x,
          padTop + plotH + 16,
        );
      }
    }

    const yTicks = niceTicks(yMin, yMax);
    for (const yVal of yTicks) {
      const y = Math.round(toY(yVal)) + 0.5;
      ctx.beginPath();
      ctx.strokeStyle = Math.abs(yVal) < 1e-6 ? '#3a4b68' : '#253147';
      ctx.setLineDash(Math.abs(yVal) < 1e-6 ? [] : [2, 4]);
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
      ctx.stroke();

      ctx.fillStyle = '#8e9db6';
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(yVal.toFixed(1), padLeft - 7, y);
    }

    ctx.setLineDash([]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(padLeft, padTop - 2, plotW, plotH + 4);
    ctx.clip();

    drawTraces(ctx, toX, toY, {
      left: padLeft,
      top: padTop,
      width: plotW,
      height: plotH,
    });

    if (hoverIndex !== null && samples[hoverIndex]) {
      const hx = toX(samples[hoverIndex].t);
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, padTop);
      ctx.lineTo(hx, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    ctx.restore();
  }, [
    width,
    height,
    samples,
    windowMs,
    yMin,
    yMax,
    hoverIndex,
    showTimeTicks,
    drawTraces,
  ]);

  const handlePointerMove = (ev: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    const padLeft = 42;
    const padRight = 14;
    const plotW = Math.max(40, rect.width - padLeft - padRight);
    const relX = (ev.clientX - rect.left - padLeft) / plotW;
    if (relX < 0 || relX > 1 || samples.length === 0) {
      onHoverIndex(null);
      return;
    }
    const idx = Math.min(
      samples.length - 1,
      Math.max(0, Math.round(relX * (samples.length - 1))),
    );
    onHoverIndex(idx);
  };

  return (
    <div className="envelope-plot-row">
      <div className="envelope-plot-header">
        <div className="envelope-plot-title">
          <span className="envelope-plot-symbol">{symbol}</span>
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </div>
        <div className="envelope-plot-legend">
          {legend.map((item) => (
            <span key={item.label}>
              <i
                style={{
                  borderColor: item.color,
                  background: item.dashed ? 'transparent' : item.color,
                  borderStyle: item.dashed ? 'dashed' : 'solid',
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="envelope-canvas-wrap"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
          aria-label={`${title} (${symbol}) time-domain oscilloscope plot`}
          role="img"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => onHoverIndex(null)}
        />
      </div>
    </div>
  );
}

export function EnvelopeScopeCanvas({
  samples,
  windowMs,
  carrierAmpV,
  messageAmpV,
  modulationIndex,
  showEnvelopeBounds = true,
  showRcTraceOnRectifier = true,
  tall = false,
}: {
  samples: EnvelopeSample[];
  windowMs: number;
  carrierAmpV: number;
  messageAmpV: number;
  modulationIndex: number;
  showEnvelopeBounds?: boolean;
  showRcTraceOnRectifier?: boolean;
  tall?: boolean;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const amPeak = Math.max(0.8, carrierAmpV * (1 + modulationIndex) * 1.15);
  const msgPeak = Math.max(0.5, messageAmpV * 1.35);
  const rowHeight = tall ? 185 : 138;
  const hovered = hoverIndex !== null ? samples[hoverIndex] : null;

  return (
    <div className="envelope-scope-stack">
      <div className="envelope-probe-bar" aria-live="polite">
        {hovered ? (
          <>
            <span>
              <b>t</b> {hovered.t.toFixed(3)} ms
            </span>
            <span>
              <b>s(t)</b> {hovered.modulated.toFixed(2)} V
            </span>
            <span>
              <b>±env</b> ±{Math.abs(hovered.upperEnvelope).toFixed(2)} V
            </span>
            <span>
              <b>v_rect</b> {hovered.rectified.toFixed(2)} V
            </span>
            <span>
              <b>m(t)</b> {hovered.message.toFixed(2)} V
            </span>
            <span>
              <b>m̂(t)</b> {hovered.recovered.toFixed(2)} V
            </span>
          </>
        ) : (
          <span className="envelope-probe-hint">
            Move cursor over any trace to inspect synchronized instantaneous
            voltages across all three stages.
          </span>
        )}
      </div>

      {/* Stage 1: Modulated AM signal s(t) with dashed upper & lower envelope boundaries */}
      <PlotCanvasRow
        title="Modulated AM Signal"
        symbol="s(t)"
        subtitle="DSB-LC carrier with upper & lower envelope boundaries"
        samples={samples}
        windowMs={windowMs}
        yMin={-amPeak}
        yMax={amPeak}
        height={rowHeight}
        hoverIndex={hoverIndex}
        onHoverIndex={setHoverIndex}
        legend={[
          { label: 's(t)', color: '#a3e635' },
          ...(showEnvelopeBounds
            ? [{ label: '±Envelope', color: '#38bdf8', dashed: true }]
            : []),
          ...(modulationIndex > 1
            ? [{ label: 'Phase reversal', color: '#fb7185' }]
            : []),
        ]}
        drawTraces={(ctx, toX, toY, bounds) => {
          // Highlight over-modulation phase-reversal zones when 1 + mu*m_n(t) < 0
          if (modulationIndex > 1) {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
            let inZone = false;
            let zoneStart = 0;
            for (let i = 0; i < samples.length; i++) {
              const rev = samples[i].phaseReversed;
              if (rev && !inZone) {
                inZone = true;
                zoneStart = toX(samples[i].t);
              } else if (!rev && inZone) {
                inZone = false;
                ctx.fillRect(
                  zoneStart,
                  bounds.top,
                  toX(samples[i].t) - zoneStart,
                  bounds.height,
                );
              }
            }
            if (inZone && samples.length > 0) {
              ctx.fillRect(
                zoneStart,
                bounds.top,
                toX(samples[samples.length - 1].t) - zoneStart,
                bounds.height,
              );
            }
          }

          // Modulated carrier trace
          ctx.beginPath();
          ctx.strokeStyle = '#a3e635';
          ctx.lineWidth = 1.25;
          for (let i = 0; i < samples.length; i++) {
            const x = toX(samples[i].t);
            const y = toY(samples[i].modulated);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Upper & lower dashed envelope boundaries
          if (showEnvelopeBounds) {
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.strokeStyle = '#38bdf8';
            for (let i = 0; i < samples.length; i++) {
              const x = toX(samples[i].t);
              const y = toY(samples[i].upperEnvelope);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle = '#60a5fa';
            for (let i = 0; i < samples.length; i++) {
              const x = toX(samples[i].t);
              const y = toY(samples[i].lowerEnvelope);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
          }
        }}
      />

      {/* Stage 2: Half-wave rectified signal v_rect(t) */}
      <PlotCanvasRow
        title="Half-Wave Rectifier Output"
        symbol="v_rect(t)"
        subtitle="Passes s(t) > 0, blocks negative half-cycles at 0 V"
        samples={samples}
        windowMs={windowMs}
        yMin={-0.15 * amPeak}
        yMax={amPeak}
        height={rowHeight}
        hoverIndex={hoverIndex}
        onHoverIndex={setHoverIndex}
        legend={[
          { label: 'Rectified', color: '#fbbf24' },
          ...(showRcTraceOnRectifier
            ? [{ label: 'RC discharge v_C(t)', color: '#e2e8f0' }]
            : []),
        ]}
        drawTraces={(ctx, toX, toY) => {
          ctx.beginPath();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.2;
          for (let i = 0; i < samples.length; i++) {
            const x = toX(samples[i].t);
            const y = toY(samples[i].rectified);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          if (showRcTraceOnRectifier) {
            ctx.beginPath();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.65;
            for (let i = 0; i < samples.length; i++) {
              const x = toX(samples[i].t);
              const y = toY(samples[i].rcVoltage);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }}
      />

      {/* Stage 3: Smoothed recovered output m_hat(t) vs original message m(t) */}
      <PlotCanvasRow
        title="Demodulated Output vs. Original Message"
        symbol="m̂(t) vs m(t)"
        subtitle="RC low-pass smoothed & AC-coupled recovery compared to m(t)"
        samples={samples}
        windowMs={windowMs}
        yMin={-msgPeak}
        yMax={msgPeak}
        height={rowHeight + 16}
        hoverIndex={hoverIndex}
        onHoverIndex={setHoverIndex}
        showTimeTicks
        legend={[
          { label: 'Original m(t)', color: '#38bdf8', dashed: true },
          {
            label: 'Recovered m̂(t)',
            color: modulationIndex > 1 ? '#fb7185' : '#c7ff35',
          },
        ]}
        drawTraces={(ctx, toX, toY) => {
          // Original baseband message (dashed reference)
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.7;
          for (let i = 0; i < samples.length; i++) {
            const x = toX(samples[i].t);
            const y = toY(samples[i].message);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();

          // Recovered output
          ctx.beginPath();
          ctx.strokeStyle = modulationIndex > 1 ? '#fb7185' : '#c7ff35';
          ctx.lineWidth = 2;
          for (let i = 0; i < samples.length; i++) {
            const x = toX(samples[i].t);
            const y = toY(samples[i].recovered);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }}
      />
    </div>
  );
}
