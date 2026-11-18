export type MessageShape = 'single-tone' | 'multi-tone';

export type ModulationRegime = 'under' | 'critical' | 'over';

export type RcFilterRegime = 'optimal' | 'too-small' | 'too-large';

export interface EnvelopeDetectorParams {
  /** Message fundamental frequency f_m in kHz */
  messageFreqKHz: number;
  /** Message peak amplitude A_m in Volts */
  messageAmpV: number;
  /** Message signal shape */
  messageShape: MessageShape;
  /** Carrier frequency f_c in kHz */
  carrierFreqKHz: number;
  /** Carrier peak amplitude A_c in Volts */
  carrierAmpV: number;
  /** Modulation index mu (dimensionless; > 1 induces over-modulation) */
  modulationIndex: number;
  /** RC low-pass time constant in milliseconds */
  rcTimeConstantMs: number;
  /** Oscilloscope window length in milliseconds */
  windowMs: number;
}

export interface EnvelopeSample {
  /** Time t in ms */
  t: number;
  /** Original baseband message m(t) in V */
  message: number;
  /** Normalized baseband message m_n(t) in [-1, 1] */
  normalizedMessage: number;
  /** Signed theoretical envelope A_c * [1 + mu * m_n(t)] in V */
  signedEnvelope: number;
  /** Upper envelope boundary +A_c * [1 + mu * m_n(t)] in V */
  upperEnvelope: number;
  /** Lower envelope boundary -A_c * [1 + mu * m_n(t)] in V */
  lowerEnvelope: number;
  /** True when 1 + mu * m_n(t) < 0 (carrier phase reversal occurs) */
  phaseReversed: boolean;
  /** Conventional AM (DSB-LC) signal s(t) in V */
  modulated: number;
  /** Half-wave rectified signal v_rect(t) = max(0, s(t)) in V */
  rectified: number;
  /** Raw RC detector capacitor voltage before DC blocking in V */
  rcVoltage: number;
  /** Final AC-coupled & scaled recovered baseband output m_hat(t) in V */
  recovered: number;
}

export interface EnvelopeDetectorMetrics {
  /** Modulation regime classification */
  modulationRegime: ModulationRegime;
  /** RC filter regime classification against 1/fc << RC << 1/W */
  rcRegime: RcFilterRegime;
  /** Message bandwidth W in kHz */
  bandwidthKHz: number;
  /** Carrier period 1/fc in ms */
  carrierPeriodMs: number;
  /** Inverse message bandwidth 1/W in ms */
  messagePeriodMs: number;
  /** Recommended geometric-mean RC time constant in ms */
  recommendedRcMs: number;
  /** Theoretical diagonal clipping upper limit on RC in ms (Infinity when mu === 0) */
  maxSafeRcMs: number;
  /** Minimum value of signed envelope A_c * (1 - mu) in V */
  envelopeMinV: number;
  /** Maximum value of signed envelope A_c * (1 + mu) in V */
  envelopeMaxV: number;
  /** Fraction [0, 1] of window samples experiencing phase reversal */
  phaseReversalFraction: number;
  /** Root-mean-square error between recovered m_hat(t) and m(t) in V */
  rmseV: number;
  /** Waveform recovery fidelity percentage [0, 100] */
  fidelityPct: number;
  /** Estimated carrier power P_c = A_c^2 / (2R) with R=50 ohm in mW */
  carrierPowerMw: number;
  /** Single-tone power efficiency eta = mu^2 / (2 + mu^2) * 100% */
  powerEfficiencyPct: number;
}

export interface EnvelopeDetectorResult {
  samples: EnvelopeSample[];
  metrics: EnvelopeDetectorMetrics;
}

export const DEFAULT_ENVELOPE_PARAMS: EnvelopeDetectorParams = {
  messageFreqKHz: 1.0,
  messageAmpV: 1.0,
  messageShape: 'single-tone',
  carrierFreqKHz: 30,
  carrierAmpV: 1.0,
  modulationIndex: 0.7,
  rcTimeConstantMs: 0.18,
  windowMs: 4,
};

export function getMessageBandwidthKHz(
  messageFreqKHz: number,
  messageShape: MessageShape,
): number {
  return messageShape === 'multi-tone' ? messageFreqKHz * 3 : messageFreqKHz;
}

export function evaluateNormalizedMessage(
  tMs: number,
  messageFreqKHz: number,
  messageShape: MessageShape,
): number {
  const omega = 2 * Math.PI * messageFreqKHz;
  if (messageShape === 'multi-tone') {
    // 0.85 cos(wt) + 0.15 cos(3wt) stays bounded exactly in [-1, 1].
    return 0.85 * Math.cos(omega * tMs) + 0.15 * Math.cos(3 * omega * tMs);
  }
  return Math.cos(omega * tMs);
}

export function classifyModulationRegime(mu: number): ModulationRegime {
  if (mu > 1.005) return 'over';
  if (mu >= 0.985) return 'critical';
  return 'under';
}

export function computeMaxSafeRcMs(bandwidthKHz: number, mu: number): number {
  if (mu <= 0.01) return Infinity;
  if (mu >= 1) {
    // Near 100% modulation, keep RC well below 1 / (2*pi*W) to minimize trough clipping.
    return 1 / (2 * Math.PI * bandwidthKHz * 1.4);
  }
  return Math.sqrt(1 - mu * mu) / (2 * Math.PI * bandwidthKHz * mu);
}

export function computeOptimalRcMs(
  carrierFreqKHz: number,
  bandwidthKHz: number,
  mu: number,
): number {
  const carrierPeriodMs = 1 / carrierFreqKHz;
  const messagePeriodMs = 1 / bandwidthKHz;
  const geometricMean = Math.sqrt(carrierPeriodMs * messagePeriodMs);
  const safeSlopeCap = computeMaxSafeRcMs(bandwidthKHz, Math.min(mu, 0.95));
  const target = Math.min(geometricMean, safeSlopeCap * 0.85);
  return Number(Math.max(carrierPeriodMs * 2.5, target).toFixed(2));
}

export function classifyRcFilterRegime(
  rcTimeConstantMs: number,
  carrierFreqKHz: number,
  bandwidthKHz: number,
  mu: number,
): RcFilterRegime {
  const carrierPeriodMs = 1 / carrierFreqKHz;
  const messagePeriodMs = 1 / bandwidthKHz;
  const maxSafeRc = computeMaxSafeRcMs(bandwidthKHz, Math.min(mu, 0.92));

  if (rcTimeConstantMs < carrierPeriodMs * 2.2) {
    return 'too-small';
  }
  if (rcTimeConstantMs > Math.min(messagePeriodMs * 0.45, maxSafeRc * 1.35)) {
    return 'too-large';
  }
  return 'optimal';
}

export function computeEnvelopeDetection(
  params: EnvelopeDetectorParams,
  sampleCount = 2400,
): EnvelopeDetectorResult {
  const {
    messageFreqKHz,
    messageAmpV,
    messageShape,
    carrierFreqKHz,
    carrierAmpV,
    modulationIndex: mu,
    rcTimeConstantMs,
    windowMs,
  } = params;

  const bandwidthKHz = getMessageBandwidthKHz(messageFreqKHz, messageShape);
  const carrierPeriodMs = 1 / carrierFreqKHz;
  const messagePeriodMs = 1 / bandwidthKHz;
  const dt = windowMs / (sampleCount - 1);
  const decayFactor = Math.exp(-dt / Math.max(rcTimeConstantMs, 1e-4));

  // Pre-warm capacitor voltage from t = 0 initial envelope peak to avoid artificial startup transient.
  const initialMn = evaluateNormalizedMessage(0, messageFreqKHz, messageShape);
  let capacitorV = Math.max(0, carrierAmpV * (1 + mu * initialMn));

  const rawSamples: Omit<EnvelopeSample, 'recovered'>[] = new Array(
    sampleCount,
  );
  let phaseReversedCount = 0;

  for (let i = 0; i < sampleCount; i++) {
    const t = i * dt;
    const normalizedMessage = evaluateNormalizedMessage(
      t,
      messageFreqKHz,
      messageShape,
    );
    const message = messageAmpV * normalizedMessage;
    const signedEnvelope = carrierAmpV * (1 + mu * normalizedMessage);
    const phaseReversed = signedEnvelope < 0;
    if (phaseReversed) phaseReversedCount++;

    const modulated =
      signedEnvelope * Math.cos(2 * Math.PI * carrierFreqKHz * t);
    const rectified = modulated > 0 ? modulated : 0;

    // Ideal half-wave diode + parallel RC envelope detector:
    // charges instantaneously when rectified input exceeds capacitor voltage,
    // otherwise discharges exponentially with time constant tau = RC.
    if (rectified > capacitorV) {
      capacitorV = rectified;
    } else {
      capacitorV *= decayFactor;
    }

    rawSamples[i] = {
      t,
      message,
      normalizedMessage,
      signedEnvelope,
      upperEnvelope: signedEnvelope,
      lowerEnvelope: -signedEnvelope,
      phaseReversed,
      modulated,
      rectified,
      rcVoltage: capacitorV,
    };
  }

  // Simulate AC-coupling capacitor (removes DC average of RC output) and receiver gain scaling.
  let sumRc = 0;
  for (let i = 0; i < sampleCount; i++) {
    sumRc += rawSamples[i].rcVoltage;
  }
  const meanRc = sumRc / sampleCount;
  const safeMu = Math.max(mu, 1e-4);
  const scale = messageAmpV / (safeMu * Math.max(carrierAmpV, 1e-4));

  const samples: EnvelopeSample[] = new Array(sampleCount);
  let sumSqErr = 0;
  let sumSqMsg = 0;

  for (let i = 0; i < sampleCount; i++) {
    const row = rawSamples[i];
    const recovered = mu <= 0.005 ? 0 : (row.rcVoltage - meanRc) * scale;
    const err = recovered - row.message;
    sumSqErr += err * err;
    sumSqMsg += row.message * row.message;
    samples[i] = { ...row, recovered };
  }

  const rmseV = Math.sqrt(sumSqErr / sampleCount);
  const rmsMsg = Math.sqrt(sumSqMsg / sampleCount);
  const normalizedError = rmsMsg > 1e-6 ? rmseV / rmsMsg : 0;
  const fidelityPct = Math.max(0, Math.min(100, (1 - normalizedError) * 100));

  const modulationRegime = classifyModulationRegime(mu);
  const rcRegime = classifyRcFilterRegime(
    rcTimeConstantMs,
    carrierFreqKHz,
    bandwidthKHz,
    mu,
  );
  const recommendedRcMs = computeOptimalRcMs(carrierFreqKHz, bandwidthKHz, mu);
  const maxSafeRcMs = computeMaxSafeRcMs(bandwidthKHz, mu);

  // Carrier power into 50 ohm load in mW: (Ac^2 / (2 * 50)) * 1000 = 10 * Ac^2
  const carrierPowerMw = (carrierAmpV * carrierAmpV * 1000) / (2 * 50);
  const powerEfficiencyPct =
    messageShape === 'single-tone'
      ? ((mu * mu) / (2 + mu * mu)) * 100
      : ((0.745 * mu * mu) / (2 + 0.745 * mu * mu)) * 100;

  return {
    samples,
    metrics: {
      modulationRegime,
      rcRegime,
      bandwidthKHz,
      carrierPeriodMs,
      messagePeriodMs,
      recommendedRcMs,
      maxSafeRcMs,
      envelopeMinV: carrierAmpV * (1 - mu),
      envelopeMaxV: carrierAmpV * (1 + mu),
      phaseReversalFraction: phaseReversedCount / sampleCount,
      rmseV,
      fidelityPct,
      carrierPowerMw,
      powerEfficiencyPct,
    },
  };
}
