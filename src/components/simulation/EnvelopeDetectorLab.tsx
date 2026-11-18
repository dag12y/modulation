import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Info,
  Maximize2,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DEFAULT_ENVELOPE_PARAMS,
  computeEnvelopeDetection,
  computeOptimalRcMs,
  getMessageBandwidthKHz,
} from '@/lib/envelopeDetector';
import type {
  EnvelopeDetectorParams,
  MessageShape,
} from '@/lib/envelopeDetector';
import { EnvelopeScopeCanvas } from '@/components/charts/EnvelopeScopeCanvas';
import { Equation } from '@/components/Equation';
import { Dialog } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Link } from '@/app/router';

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  digits?: number;
  onChange: (value: number) => void;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  digits = 2,
  onChange,
}: ControlSliderProps) {
  const progress = Math.max(
    0,
    Math.min(100, ((value - min) / (max - min)) * 100),
  );
  return (
    <label className="dial-field">
      <span>
        {label}
        <output className="tabular-nums">
          {value.toFixed(digits)} {unit && <small>{unit}</small>}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value.toFixed(digits)} ${unit}`.trim()}
        onChange={(ev) => onChange(Number(ev.target.value))}
        style={{ '--range-progress': `${progress}%` } as CSSProperties}
      />
      <span className="dial-limits">
        <small>
          {min} {unit}
        </small>
        <small>
          {max} {unit}
        </small>
      </span>
    </label>
  );
}

export function EnvelopeDetectorLab() {
  const [params, setParams] = useState<EnvelopeDetectorParams>(
    DEFAULT_ENVELOPE_PARAMS,
  );
  const [showEnvelopeBounds, setShowEnvelopeBounds] = useState(true);
  const [showRcTraceOnRectifier, setShowRcTraceOnRectifier] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(() => computeEnvelopeDetection(params), [params]);
  const { samples, metrics } = result;

  const updateParam = <K extends keyof EnvelopeDetectorParams>(
    key: K,
    value: EnvelopeDetectorParams[K],
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const applyOptimalRc = () => {
    const bw = getMessageBandwidthKHz(
      params.messageFreqKHz,
      params.messageShape,
    );
    const opt = computeOptimalRcMs(
      params.carrierFreqKHz,
      bw,
      params.modulationIndex,
    );
    updateParam('rcTimeConstantMs', Math.min(1.5, Math.max(0.01, opt)));
  };

  const regimeMeta =
    metrics.modulationRegime === 'over'
      ? {
          tone: 'danger',
          label: 'OVER-MODULATED (μ > 1)',
          shortLabel: 'Distortion & phase reversal',
          Icon: AlertTriangle,
        }
      : metrics.modulationRegime === 'critical'
        ? {
            tone: 'warning',
            label: '100% MODULATION (μ = 1.00)',
            shortLabel: 'Envelope touches zero',
            Icon: Info,
          }
        : {
            tone: 'nominal',
            label: 'UNDER-MODULATED (μ < 1)',
            shortLabel: 'Clean envelope tracking',
            Icon: CheckCircle2,
          };

  const rcStatusLabel =
    metrics.rcRegime === 'too-small'
      ? 'Carrier ripple (RC too small)'
      : metrics.rcRegime === 'too-large'
        ? 'Diagonal clipping (RC too large)'
        : 'Optimal window (1/fc ≪ RC ≪ 1/W)';

  const RegimeIcon = regimeMeta.Icon;

  return (
    <div className="envelope-lab">
      <section
        className="instrument-surface instrument-bench envelope-bench"
        aria-label="Conventional AM envelope detector simulator"
      >
        <div className="bench-topline">
          <span>
            <ScanLine size={15} /> ENVELOPE DETECTOR <b>/</b> DSB-LC RECEIVER
          </span>
          <span className={`envelope-status-tag ${regimeMeta.tone}`}>
            <RegimeIcon size={13} />
            <span>{regimeMeta.label}</span>
          </span>
        </div>

        <div className="envelope-bench-grid">
          <section className="oscilloscope">
            <div className="scope-toolbar">
              <div>
                <span className="instrument-kicker">
                  TIME DOMAIN · 3-STAGE PIPELINE
                </span>
                <h2>Modulation, rectification &amp; RC recovery</h2>
              </div>
              <div className="scope-actions">
                <div
                  className="segmented"
                  role="group"
                  aria-label="Time window"
                >
                  {[4, 2].map((win) => (
                    <button
                      key={win}
                      type="button"
                      aria-pressed={params.windowMs === win}
                      className={params.windowMs === win ? 'selected' : ''}
                      onClick={() => updateParam('windowMs', win)}
                    >
                      {win} ms
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="expand-scope"
                  onClick={() => setExpanded(true)}
                  aria-label="Expand envelope detector oscilloscope"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            <EnvelopeScopeCanvas
              samples={samples}
              windowMs={params.windowMs}
              carrierAmpV={params.carrierAmpV}
              messageAmpV={params.messageAmpV}
              modulationIndex={params.modulationIndex}
              showEnvelopeBounds={showEnvelopeBounds}
              showRcTraceOnRectifier={showRcTraceOnRectifier}
            />

            <div className="scope-bottomline envelope-bottomline">
              <span className="tabular-nums">
                1/f<sub>c</sub>{' '}
                <strong>{metrics.carrierPeriodMs.toFixed(3)} ms</strong>
              </span>
              <span className="tabular-nums">
                RC <strong>{params.rcTimeConstantMs.toFixed(2)} ms</strong>
              </span>
              <span className="tabular-nums">
                1/W <strong>{metrics.messagePeriodMs.toFixed(3)} ms</strong>
              </span>
              <span className="tabular-nums">
                WINDOW <strong>{params.windowMs} ms</strong>
              </span>
            </div>
          </section>

          <aside
            className="instrument-controls envelope-controls"
            id="envelope-parameters"
          >
            <div className="instrument-controls-title">
              <SlidersHorizontal size={16} />
              <h3>Detector parameters</h3>
              <button
                type="button"
                className="envelope-reset-btn"
                onClick={() => setParams(DEFAULT_ENVELOPE_PARAMS)}
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            <div className="envelope-presets" aria-label="Modulation presets">
              <button
                type="button"
                className={params.modulationIndex < 0.985 ? 'active' : ''}
                onClick={() => updateParam('modulationIndex', 0.6)}
              >
                Under (μ=0.6)
              </button>
              <button
                type="button"
                className={
                  params.modulationIndex >= 0.985 &&
                  params.modulationIndex <= 1.005
                    ? 'active'
                    : ''
                }
                onClick={() => updateParam('modulationIndex', 1.0)}
              >
                100% (μ=1.0)
              </button>
              <button
                type="button"
                className={params.modulationIndex > 1.005 ? 'active' : ''}
                onClick={() => updateParam('modulationIndex', 1.5)}
              >
                Over (μ=1.5)
              </button>
            </div>

            <div className="envelope-control-group">
              <span className="channel-label message-color">
                01 / BASEBAND MESSAGE m(t)
              </span>
              <div className="envelope-shape-toggle">
                <span>Waveform</span>
                <div className="segmented">
                  {(
                    [
                      ['single-tone', 'Single-tone'],
                      ['multi-tone', 'Audio (2-tone)'],
                    ] as [MessageShape, string][]
                  ).map(([shape, label]) => (
                    <button
                      key={shape}
                      type="button"
                      aria-pressed={params.messageShape === shape}
                      className={
                        params.messageShape === shape ? 'selected' : ''
                      }
                      onClick={() => updateParam('messageShape', shape)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <ControlSlider
                label="Message frequency fm"
                value={params.messageFreqKHz}
                min={0.2}
                max={2.5}
                step={0.1}
                unit="kHz"
                digits={1}
                onChange={(v) => updateParam('messageFreqKHz', v)}
              />
              <ControlSlider
                label="Message amplitude Am"
                value={params.messageAmpV}
                min={0.2}
                max={2.0}
                step={0.1}
                unit="V"
                digits={1}
                onChange={(v) => updateParam('messageAmpV', v)}
              />
            </div>

            <div className="envelope-control-group">
              <span className="channel-label carrier-color">
                02 / CARRIER c(t)
              </span>
              <ControlSlider
                label="Carrier frequency fc"
                value={params.carrierFreqKHz}
                min={10}
                max={50}
                step={1}
                unit="kHz"
                digits={0}
                onChange={(v) => updateParam('carrierFreqKHz', v)}
              />
              <ControlSlider
                label="Carrier amplitude Ac"
                value={params.carrierAmpV}
                min={0.5}
                max={2.0}
                step={0.1}
                unit="V"
                digits={1}
                onChange={(v) => updateParam('carrierAmpV', v)}
              />
            </div>

            <div className="envelope-control-group">
              <span className="channel-label modulated-color">
                03 / MODULATION &amp; RC FILTER
              </span>
              <ControlSlider
                label="Modulation index μ"
                value={params.modulationIndex}
                min={0.1}
                max={1.8}
                step={0.05}
                unit=""
                digits={2}
                onChange={(v) => updateParam('modulationIndex', v)}
              />
              <ControlSlider
                label="Time constant RC"
                value={params.rcTimeConstantMs}
                min={0.01}
                max={1.5}
                step={0.01}
                unit="ms"
                digits={2}
                onChange={(v) => updateParam('rcTimeConstantMs', v)}
              />
              <div className="envelope-rc-helper">
                <span className={`rc-regime-text ${metrics.rcRegime}`}>
                  {rcStatusLabel}
                </span>
                <button
                  type="button"
                  className="envelope-opt-btn"
                  onClick={applyOptimalRc}
                >
                  Set optimal ({metrics.recommendedRcMs.toFixed(2)} ms)
                </button>
              </div>
            </div>

            <div className="envelope-switches">
              <label>
                <span>Show ±envelope boundaries</span>
                <Switch
                  checked={showEnvelopeBounds}
                  onCheckedChange={setShowEnvelopeBounds}
                />
              </label>
              <label>
                <span>Overlay RC voltage on rectifier</span>
                <Switch
                  checked={showRcTraceOnRectifier}
                  onCheckedChange={setShowRcTraceOnRectifier}
                />
              </label>
            </div>
          </aside>
        </div>

        <div className="bench-footer">
          <span>CONVENTIONAL AM (DSB-LC) · NON-COHERENT ENVELOPE DETECTOR</span>
          <span>
            Bandwidth W = {metrics.bandwidthKHz.toFixed(1)} kHz · Single-tone η
            = {metrics.powerEfficiencyPct.toFixed(1)}%
          </span>
        </div>
      </section>

      {/* Live quantitative telemetry strip */}
      <section
        className="envelope-metrics-strip"
        aria-label="Envelope detector performance metrics"
      >
        <article className="envelope-metric-card">
          <span className="eyebrow">MODULATION DEPTH</span>
          <strong className="tabular-nums">
            {(params.modulationIndex * 100).toFixed(0)}%
            <small>μ = {params.modulationIndex.toFixed(2)}</small>
          </strong>
          <p>{regimeMeta.shortLabel}</p>
        </article>
        <article className="envelope-metric-card">
          <span className="eyebrow">ENVELOPE MINIMUM</span>
          <strong className="tabular-nums">
            {metrics.envelopeMinV.toFixed(2)} <small>V</small>
          </strong>
          <p>
            {metrics.envelopeMinV < -0.005
              ? `Inverted ${(metrics.phaseReversalFraction * 100).toFixed(0)}% of cycle`
              : metrics.envelopeMinV <= 0.015
                ? 'Just reaches 0 V threshold'
                : 'Strictly positive envelope'}
          </p>
        </article>
        <article className="envelope-metric-card">
          <span className="eyebrow">RC CONSTRAINT (1/fc ≪ RC ≪ 1/W)</span>
          <strong className="tabular-nums">
            {params.rcTimeConstantMs.toFixed(2)} <small>ms</small>
          </strong>
          <p className="tabular-nums">
            Bounds: {metrics.carrierPeriodMs.toFixed(3)} –{' '}
            {metrics.messagePeriodMs.toFixed(2)} ms
          </p>
        </article>
        <article className="envelope-metric-card">
          <span className="eyebrow">RECOVERY FIDELITY</span>
          <strong className="tabular-nums">
            {metrics.fidelityPct.toFixed(1)}%
            <small>RMSE {metrics.rmseV.toFixed(3)} V</small>
          </strong>
          <p>Recovered m̂(t) vs. original m(t)</p>
        </article>
      </section>

      {/* Dynamic Educational Insights & Over-Modulation Callout Panel */}
      <section
        className={`envelope-callout ${regimeMeta.tone}`}
        aria-live="polite"
      >
        <div className="envelope-callout-head">
          <div className="envelope-callout-title">
            <RegimeIcon size={18} />
            <div>
              <span className="eyebrow">DETECTOR DIAGNOSTIC</span>
              <h2>
                {metrics.modulationRegime === 'over'
                  ? 'Over-modulation detected (μ > 1): envelope detector fails.'
                  : metrics.modulationRegime === 'critical'
                    ? '100% modulation (μ = 1): critical distortion-free limit.'
                    : 'Under-modulation (μ < 1): envelope cleanly tracks m(t).'}
              </h2>
            </div>
          </div>
          {metrics.modulationRegime === 'over' && (
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={() => updateParam('modulationIndex', 0.7)}
            >
              Restore μ = 0.70
            </button>
          )}
        </div>

        {metrics.modulationRegime === 'over' ? (
          <div className="envelope-callout-body">
            <p>
              When <strong>μ &gt; 1</strong>, the term <code>1 + μ·mₙ(t)</code>{' '}
              drops below zero on negative message peaks, causing a{' '}
              <strong>180° carrier phase reversal</strong>. Because the diode
              half-wave rectifier only passes positive carrier half-cycles (
              <code>s(t) &gt; 0</code>), the RC stage tracks the absolute
              magnitude <code>A꜀|1 + μ·mₙ(t)|</code> rather than{' '}
              <code>A꜀[1 + μ·mₙ(t)]</code>—folding negative troughs upward and
              introducing severe clipping and harmonic distortion.
            </p>
            <div className="envelope-remedies">
              <div>
                <strong>Remedy 1 · Coherent (Synchronous) Detection</strong>
                <p>
                  Multiply <code>s(t)</code> by a phase-locked local oscillator{' '}
                  <code>cos(2πf꜀t)</code> and low-pass filter. Because coherent
                  mixing preserves the sign of <code>1 + μ·mₙ(t)</code>, it
                  recovers <code>m(t)</code> without distortion even for{' '}
                  <code>μ &gt; 1</code>.
                </p>
              </div>
              <div>
                <strong>Remedy 2 · DC Carrier Term Adjustment</strong>
                <p>
                  Increase the transmitted carrier amplitude <code>A꜀</code> (or
                  attenuate <code>m(t)</code>) so that{' '}
                  <code>μ = Aₘ / A꜀ ≤ 1</code> (equivalently adding sufficient
                  DC offset before modulation) to keep the envelope
                  non-negative.
                </p>
              </div>
            </div>
          </div>
        ) : metrics.modulationRegime === 'critical' ? (
          <div className="envelope-callout-body">
            <p>
              At <strong>μ = 1.00</strong> (100% modulation), the envelope{' '}
              <code>A꜀[1 + mₙ(t)]</code> just touches <code>0 V</code> at each
              negative message trough without crossing zero or flipping carrier
              phase. This achieves the maximum power efficiency for conventional
              single-tone AM (<code>η = 33.3%</code>), though any further
              increase in message amplitude immediately triggers
              over-modulation.
            </p>
          </div>
        ) : (
          <div className="envelope-callout-body">
            <p>
              With{' '}
              <strong>μ = {params.modulationIndex.toFixed(2)} &lt; 1</strong>,{' '}
              <code>1 + μ·mₙ(t) &gt; 0</code> everywhere so the carrier
              maintains constant phase. Half-wave rectification followed by RC
              smoothing recovers the positive envelope proportionally to{' '}
              <code>m(t)</code>, and AC coupling removes the carrier DC term{' '}
              <code>A꜀</code>.
            </p>
          </div>
        )}

        {metrics.rcRegime !== 'optimal' && (
          <div className="envelope-rc-callout">
            <AlertTriangle size={15} />
            <div>
              <strong>
                {metrics.rcRegime === 'too-small'
                  ? 'RC time constant is too small (carrier ripple).'
                  : 'RC time constant is too large (diagonal clipping).'}
              </strong>{' '}
              {metrics.rcRegime === 'too-small'
                ? `Because RC (${params.rcTimeConstantMs.toFixed(2)} ms) approaches 1/fc (${metrics.carrierPeriodMs.toFixed(3)} ms), the capacitor discharges noticeably between carrier peaks and leaks carrier ripple into m̂(t).`
                : `Because RC (${params.rcTimeConstantMs.toFixed(2)} ms) is too close to 1/W (${metrics.messagePeriodMs.toFixed(2)} ms), the capacitor cannot discharge fast enough on downward message slopes, causing diagonal clipping.`}
            </div>
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={applyOptimalRc}
            >
              Fix RC
            </button>
          </div>
        )}
      </section>

      {/* Chapter 2 Mathematical Foundations */}
      <section className="learning-strip envelope-math-strip">
        <div className="learning-model">
          <span className="eyebrow">
            <BookOpen size={13} /> CHAPTER 2 · MATHEMATICAL FOUNDATIONS
          </span>
          <Equation
            math={String.raw`s(t)=A_c\left[1+\mu\,\tilde{m}(t)\right]\cos(2\pi f_c t),\qquad v_{\mathrm{rect}}(t)=\max\!\big(0,\,s(t)\big)`}
            block
          />
          <p>
            For distortion-free envelope recovery, the envelope must remain
            non-negative (<code>1 + μ·m̃(t) ≥ 0</code>) and the RC discharge rate
            must satisfy both ripple suppression and slope tracking:
          </p>
          <Equation
            math={String.raw`\frac{1}{f_c}\ll RC \ll \frac{1}{W},\qquad RC_{\max}=\frac{\sqrt{1-\mu^2}}{2\pi W\mu}\;\;(\mu<1)`}
            block
          />
          <Link className="text-link" to="/theory">
            Review full AM theory &amp; equations <ArrowRight size={13} />
          </Link>
        </div>

        <div className="learning-insight">
          <span className="eyebrow">PIPELINE SUMMARY</span>
          <h2>Three stages from RF carrier to baseband.</h2>
          <p>
            Unlike DSB-SC, SSB-SC, and VSB—which suppress the carrier and
            require a synchronized local oscillator—conventional DSB-LC embeds a
            carrier term so an inexpensive diode and RC pair can track the
            message envelope.
          </p>
          <dl>
            <div>
              <dt>1. Envelope condition</dt>
              <dd>μ ≤ 1 keeps 1 + μ·m̃(t) ≥ 0</dd>
            </div>
            <div>
              <dt>2. Rectifier stage</dt>
              <dd>Passes s(t) &gt; 0, blocks s(t) &lt; 0</dd>
            </div>
            <div>
              <dt>3. RC smoothing</dt>
              <dd>
                Optimal ≈ {metrics.recommendedRcMs.toFixed(2)} ms (1/fc ≪ RC ≪
                1/W)
              </dd>
            </div>
            <div>
              <dt>4. DC blocking</dt>
              <dd>Removes A꜀ offset to yield m̂(t)</dd>
            </div>
          </dl>
        </div>
      </section>

      <Dialog
        open={expanded}
        onOpenChange={setExpanded}
        title="Envelope Detector / Oscilloscope"
        description={`DSB-LC time-domain traces · fc = ${params.carrierFreqKHz} kHz, fm = ${params.messageFreqKHz.toFixed(1)} kHz, μ = ${params.modulationIndex.toFixed(2)}, RC = ${params.rcTimeConstantMs.toFixed(2)} ms`}
        className="scope-dialog instrument-surface"
      >
        <div className="expanded-traces">
          <EnvelopeScopeCanvas
            samples={samples}
            windowMs={params.windowMs}
            carrierAmpV={params.carrierAmpV}
            messageAmpV={params.messageAmpV}
            modulationIndex={params.modulationIndex}
            showEnvelopeBounds={showEnvelopeBounds}
            showRcTraceOnRectifier={showRcTraceOnRectifier}
            tall
          />
        </div>
      </Dialog>
    </div>
  );
}
