export type SsbSideband = 'USB' | 'LSB';
export type BasebandShape = 'tone' | 'two-tone' | 'harmonic';

export interface SsbParams {
  fmKHz: number;
  AmV: number;
  fcKHz: number;
  AcV: number;
  sideband: SsbSideband;
  shape: BasebandShape;
  phaseErrorDeg: number;
  freqOffsetHz: number;
  lpfCutoffKHz: number;
}

export const DEFAULT_SSB_PARAMS: SsbParams = {
  fmKHz: 1.0,
  AmV: 1.0,
  fcKHz: 10,
  AcV: 1.0,
  sideband: 'USB',
  shape: 'tone',
  phaseErrorDeg: 0,
  freqOffsetHz: 0,
  lpfCutoffKHz: 4.0,
};

export interface SsbWaveformSample {
  time: number;
  message: number;
  hilbert: number;
  carrier: number;
  ssb: number;
  envelope: number;
  mixer: number;
  recovered: number;
}

export interface SsbSpectrumPoint {
  frequency: number;
  amplitude: number;
  label: string;
}

export interface ReceiverSpectrumPoint {
  frequency: number;
  mixerMag: number;
  recoveredMag: number;
}

export interface SsbMetrics {
  messageBandwidthKHz: number;
  occupiedBandwidthKHz: number;
  activeToneFreqsKHz: number[];
  peakSidebandFreqKHz: number;
  peakSsbV: number;
  avgTxPowerMw: number;
  dsbFcPowerMw: number;
  powerSavedPercent: number;
  carrierSuppressionDb: number;
  sidebandSuppressionDb: number;
  rmseV: number;
  correlation: number;
  lpfRejectionDb: number;
}

export interface SsbSimulationResult {
  samples: SsbWaveformSample[];
  spectrum: SsbSpectrumPoint[];
  receiverSpectrum: ReceiverSpectrumPoint[];
  metrics: SsbMetrics;
}

export function getActiveToneFreqsKHz(
  fmKHz: number,
  shape: BasebandShape,
): number[] {
  if (shape === 'two-tone') {
    return [Number(fmKHz.toFixed(2)), Number((1.5 * fmKHz).toFixed(2))];
  }
  if (shape === 'harmonic') {
    return [Number(fmKHz.toFixed(2)), Number((2 * fmKHz).toFixed(2))];
  }
  return [Number(fmKHz.toFixed(2))];
}

export function getMessageBandwidthKHz(
  fmKHz: number,
  shape: BasebandShape,
): number {
  if (shape === 'two-tone') return 1.5 * fmKHz;
  if (shape === 'harmonic') return 2 * fmKHz;
  return fmKHz;
}

/**
 * Evaluates the baseband message m(t) and its exact analytic Hilbert transform m̂(t).
 * Time tMs is in milliseconds, frequencies are in kHz (so f_kHz * t_ms = cycles).
 */
export function evaluateMessage(
  tMs: number,
  AmV: number,
  fmKHz: number,
  shape: BasebandShape,
): { m: number; mHat: number } {
  const w1 = 2 * Math.PI * fmKHz * tMs;
  if (shape === 'two-tone') {
    const w2 = 2 * Math.PI * (1.5 * fmKHz) * tMs;
    return {
      m: AmV * (0.6 * Math.cos(w1) + 0.4 * Math.cos(w2)),
      mHat: AmV * (0.6 * Math.sin(w1) + 0.4 * Math.sin(w2)),
    };
  }
  if (shape === 'harmonic') {
    const w2 = 2 * Math.PI * (2 * fmKHz) * tMs + Math.PI / 4;
    return {
      m: AmV * (0.65 * Math.cos(w1) + 0.35 * Math.cos(w2)),
      mHat: AmV * (0.65 * Math.sin(w1) + 0.35 * Math.sin(w2)),
    };
  }
  return {
    m: AmV * Math.cos(w1),
    mHat: AmV * Math.sin(w1),
  };
}

interface BiquadCoeffs {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

function makeButterworthBiquad(
  cutoffKHz: number,
  sampleRateKHz: number,
  q: number,
): BiquadCoeffs {
  const nyquist = sampleRateKHz / 2;
  const fc = Math.max(0.05, Math.min(cutoffKHz, nyquist * 0.94));
  const k = Math.tan((Math.PI * fc) / sampleRateKHz);
  const k2 = k * k;
  const norm = 1 / (1 + k / q + k2);
  return {
    b0: k2 * norm,
    b1: 2 * k2 * norm,
    b2: k2 * norm,
    a1: 2 * (k2 - 1) * norm,
    a2: (1 - k / q + k2) * norm,
  };
}

function applyBiquad(input: Float64Array, c: BiquadCoeffs): Float64Array {
  const out = new Float64Array(input.length);
  let x1 = input[0] ?? 0;
  let x2 = x1;
  let y1 = x1;
  let y2 = x1;
  for (let i = 0; i < input.length; i++) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
}

/**
 * Zero-phase 4th-order Butterworth low-pass filter (cascaded biquads forward & backward).
 */
function butterworthLowPassZeroPhase(
  signal: Float64Array,
  cutoffKHz: number,
  sampleRateKHz: number,
): Float64Array {
  // Q values for 4th-order Butterworth cascade: 1 / (2 * cos(pi*(2k+1)/8))
  const q1 = 1 / (2 * Math.cos(Math.PI / 8));
  const q2 = 1 / (2 * Math.cos((3 * Math.PI) / 8));
  const c1 = makeButterworthBiquad(cutoffKHz, sampleRateKHz, q1);
  const c2 = makeButterworthBiquad(cutoffKHz, sampleRateKHz, q2);

  // Forward pass
  let stage = applyBiquad(signal, c1);
  stage = applyBiquad(stage, c2);

  // Reverse
  const reversed = new Float64Array(stage.length);
  for (let i = 0; i < stage.length; i++) {
    reversed[i] = stage[stage.length - 1 - i];
  }

  // Backward pass
  let back = applyBiquad(reversed, c1);
  back = applyBiquad(back, c2);

  const result = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) {
    result[i] = back[back.length - 1 - i];
  }
  return result;
}

/**
 * In-place radix-2 Cooley-Tukey FFT. N must be a power of 2.
 */
function radix2Fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) {
      j ^= bit;
    }
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepRe = Math.cos(angle);
    const wStepIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j];
        const uIm = im[i + j];
        const vRe = re[i + j + half] * wRe - im[i + j + half] * wIm;
        const vIm = re[i + j + half] * wIm + im[i + j + half] * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nextRe = wRe * wStepRe - wIm * wStepIm;
        wIm = wRe * wStepIm + wIm * wStepRe;
        wRe = nextRe;
      }
    }
  }
}

/**
 * Computes single-sided magnitude spectrum (in peak Volts) using a 4096-point Hann-windowed FFT.
 * fs = 204.8 kHz, N = 4096 => df = 0.05 kHz exact bin spacing.
 */
function computeOneSidedSpectrum(
  signal: Float64Array,
  startIndex: number,
  fftSize: number,
): Float64Array {
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);
  let windowSum = 0;
  for (let i = 0; i < fftSize; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
    windowSum += w;
    re[i] = signal[startIndex + i] * w;
  }
  radix2Fft(re, im);

  const half = fftSize >> 1;
  const mags = new Float64Array(half);
  const scale = 2 / windowSum;
  for (let k = 0; k < half; k++) {
    const mag = Math.hypot(re[k], im[k]) * scale;
    mags[k] = k === 0 ? mag * 0.5 : mag;
  }
  return mags;
}

function round(val: number, decimals = 4): number {
  const f = 10 ** decimals;
  return Math.round(val * f) / f;
}

export function simulateSsb(params: SsbParams): SsbSimulationResult {
  const {
    fmKHz,
    AmV,
    fcKHz,
    AcV,
    sideband,
    shape,
    phaseErrorDeg,
    freqOffsetHz,
    lpfCutoffKHz,
  } = params;

  // High-resolution uniform grid: fs = 204.8 kHz => dt = 1/204.8 ms, df = 0.05 kHz over N=4096 (20 ms)
  const sampleRateKHz = 204.8;
  const dtMs = 1 / sampleRateKHz;
  const fftSize = 4096; // 20.0 ms
  const padSamples = 1024; // 5.0 ms pre-pad and post-pad for edge-free zero-phase filtering
  const totalSamples = fftSize + 2 * padSamples;

  const ssbBuf = new Float64Array(totalSamples);
  const mixerBuf = new Float64Array(totalSamples);
  const messageBuf = new Float64Array(totalSamples);

  const loFreqKHz = fcKHz + freqOffsetHz / 1000;
  const loPhaseRad = (phaseErrorDeg * Math.PI) / 180;
  const sign = sideband === 'USB' ? -1 : 1;

  for (let i = 0; i < totalSamples; i++) {
    const tMs = (i - padSamples) * dtMs;
    const { m, mHat } = evaluateMessage(tMs, AmV, fmKHz, shape);
    const wc = 2 * Math.PI * fcKHz * tMs;
    const ssb = 0.5 * AcV * (m * Math.cos(wc) + sign * mHat * Math.sin(wc));
    const mixer =
      (4 / Math.max(AcV, 0.01)) *
      ssb *
      Math.cos(2 * Math.PI * loFreqKHz * tMs + loPhaseRad);

    messageBuf[i] = m;
    ssbBuf[i] = ssb;
    mixerBuf[i] = mixer;
  }

  const recoveredBuf = butterworthLowPassZeroPhase(
    mixerBuf,
    lpfCutoffKHz,
    sampleRateKHz,
  );

  // Build 401 display samples covering [0, 4.00] ms (0.01 ms step) by linear interpolation
  const displayCount = 401;
  const samples: SsbWaveformSample[] = [];
  let sumSqSsb = 0;
  let peakSsbV = 0;
  let sumSqErr = 0;
  let sumM = 0;
  let sumR = 0;
  let sumM2 = 0;
  let sumR2 = 0;
  let sumMR = 0;

  for (let d = 0; d < displayCount; d++) {
    const tMs = round(d * 0.01, 2);
    const exactIdx = padSamples + tMs / dtMs;
    const idx0 = Math.min(totalSamples - 2, Math.max(0, Math.floor(exactIdx)));
    const frac = exactIdx - idx0;

    const { m, mHat } = evaluateMessage(tMs, AmV, fmKHz, shape);
    const carrier = AcV * Math.cos(2 * Math.PI * fcKHz * tMs);
    const wc = 2 * Math.PI * fcKHz * tMs;
    const ssb = 0.5 * AcV * (m * Math.cos(wc) + sign * mHat * Math.sin(wc));
    const envelope = 0.5 * AcV * Math.hypot(m, mHat);

    const mixer = mixerBuf[idx0] * (1 - frac) + mixerBuf[idx0 + 1] * frac;
    const recovered =
      recoveredBuf[idx0] * (1 - frac) + recoveredBuf[idx0 + 1] * frac;

    samples.push({
      time: tMs,
      message: round(m),
      hilbert: round(mHat),
      carrier: round(carrier),
      ssb: round(ssb),
      envelope: round(envelope),
      mixer: round(mixer),
      recovered: round(recovered),
    });

    sumSqSsb += ssb * ssb;
    if (Math.abs(ssb) > peakSsbV) peakSsbV = Math.abs(ssb);
    const err = recovered - m;
    sumSqErr += err * err;
    sumM += m;
    sumR += recovered;
    sumM2 += m * m;
    sumR2 += recovered * recovered;
    sumMR += m * recovered;
  }

  // Compute RF and receiver spectra over the 4096-sample core window [0, 20 ms)
  const ssbMags = computeOneSidedSpectrum(ssbBuf, padSamples, fftSize);
  const mixerMags = computeOneSidedSpectrum(mixerBuf, padSamples, fftSize);
  const recoveredMags = computeOneSidedSpectrum(
    recoveredBuf,
    padSamples,
    fftSize,
  );
  const dfKHz = sampleRateKHz / fftSize; // 0.05 kHz

  // RF spectrum window centered around fcKHz: [max(0, fc - 6), fc + 6] at 0.25 kHz or 0.1 kHz
  const minFreq = Math.max(0, Math.floor(fcKHz - 6));
  const maxFreq = Math.ceil(fcKHz + 6);
  const toneFreqs = getActiveToneFreqsKHz(fmKHz, shape);
  const expectedSidebandFreqs = toneFreqs.map((f) =>
    sideband === 'USB' ? fcKHz + f : fcKHz - f,
  );

  const spectrum: SsbSpectrumPoint[] = [];
  // Sample at 0.1 kHz steps (step of 2 bins) to keep chart crisp and accurate
  const minBin = Math.round(minFreq / dfKHz);
  const maxBin = Math.round(maxFreq / dfKHz);
  for (let b = minBin; b <= maxBin; b += 2) {
    const freq = round(b * dfKHz, 2);
    // Take local max across [b-1, b+1] if non-multiple of 0.1 kHz (e.g. 1.5*fm = 1.65)
    const amp = Math.max(
      ssbMags[b] ?? 0,
      ssbMags[Math.max(0, b - 1)] ?? 0,
      ssbMags[Math.min(ssbMags.length - 1, b + 1)] ?? 0,
    );
    const matchingTone = expectedSidebandFreqs.find(
      (tf) => Math.abs(tf - freq) < 0.08,
    );
    const label =
      matchingTone !== undefined
        ? sideband
        : Math.abs(freq - fcKHz) < 0.03
          ? ''
          : '';
    spectrum.push({
      frequency: freq,
      amplitude: round(amp, 4),
      label,
    });
  }

  // Receiver spectrum from 0 to min(60, max(24, 2*fc + 4)) kHz at 0.25 kHz steps (every 5 bins)
  const rxMaxFreq = Math.min(80, Math.max(24, Math.ceil(2 * fcKHz + 6)));
  const rxMaxBin = Math.round(rxMaxFreq / dfKHz);
  const receiverSpectrum: ReceiverSpectrumPoint[] = [];
  for (let b = 0; b <= rxMaxBin; b += 5) {
    const freq = round(b * dfKHz, 2);
    let maxMix = 0;
    let maxRec = 0;
    for (
      let k = Math.max(0, b - 2);
      k <= Math.min(mixerMags.length - 1, b + 2);
      k++
    ) {
      if (mixerMags[k] > maxMix) maxMix = mixerMags[k];
      if (recoveredMags[k] > maxRec) maxRec = recoveredMags[k];
    }
    receiverSpectrum.push({
      frequency: freq,
      mixerMag: round(maxMix, 4),
      recoveredMag: round(maxRec, 4),
    });
  }

  // Spectral measurements (carrier suppression & unwanted sideband rejection)
  const carrierBin = Math.round(fcKHz / dfKHz);
  const carrierLeak = ssbMags[carrierBin] ?? 0;
  let primarySidebandPeak = 0;
  for (const tf of expectedSidebandFreqs) {
    const bin = Math.round(tf / dfKHz);
    if (bin >= 0 && bin < ssbMags.length) {
      primarySidebandPeak = Math.max(primarySidebandPeak, ssbMags[bin]);
    }
  }
  const unwantedFreq = sideband === 'USB' ? fcKHz - fmKHz : fcKHz + fmKHz;
  const unwantedBin = Math.round(unwantedFreq / dfKHz);
  const unwantedLeak =
    unwantedBin >= 0 && unwantedBin < ssbMags.length ? ssbMags[unwantedBin] : 0;

  const carrierSuppressionDb =
    carrierLeak > 1e-6
      ? round(
          20 * Math.log10(Math.max(primarySidebandPeak, 1e-6) / carrierLeak),
          1,
        )
      : 99.9;
  const sidebandSuppressionDb =
    unwantedLeak > 1e-6
      ? round(
          20 * Math.log10(Math.max(primarySidebandPeak, 1e-6) / unwantedLeak),
          1,
        )
      : 99.9;

  // 2*fc rejection in receiver LPF
  const doubleFcStart = Math.max(1, Math.round((2 * fcKHz - 4) / dfKHz));
  const doubleFcEnd = Math.min(
    mixerMags.length - 1,
    Math.round((2 * fcKHz + 4) / dfKHz),
  );
  let doubleFcMixPeak = 0;
  let doubleFcRecPeak = 0;
  for (let k = doubleFcStart; k <= doubleFcEnd; k++) {
    if (mixerMags[k] > doubleFcMixPeak) doubleFcMixPeak = mixerMags[k];
    if (recoveredMags[k] > doubleFcRecPeak) doubleFcRecPeak = recoveredMags[k];
  }
  const lpfRejectionDb =
    doubleFcMixPeak > 1e-6
      ? doubleFcRecPeak > 1e-7
        ? round(20 * Math.log10(doubleFcMixPeak / doubleFcRecPeak), 1)
        : 99.9
      : 0;

  // Power calculations across R = 50 Ohm (in mW)
  const loadOhm = 50;
  const avgTxPowerMw = round((sumSqSsb / displayCount / loadOhm) * 1000, 3);
  // Equivalent DSB-FC power with modulation index mu = Am / Ac (clamped <= 1 for standard AM comparison)
  const muEff = Math.min(1.5, AmV / Math.max(AcV, 0.01));
  const pcMw = ((AcV * AcV) / (2 * loadOhm)) * 1000;
  const dsbFcPowerMw = round(pcMw * (1 + (muEff * muEff) / 2), 3);
  const powerSavedPercent =
    dsbFcPowerMw > 0
      ? round(
          Math.max(0, ((dsbFcPowerMw - avgTxPowerMw) / dsbFcPowerMw) * 100),
          1,
        )
      : 0;

  const rmseV = round(Math.sqrt(sumSqErr / displayCount), 4);
  const num = displayCount * sumMR - sumM * sumR;
  const den = Math.sqrt(
    Math.max(
      1e-12,
      (displayCount * sumM2 - sumM * sumM) *
        (displayCount * sumR2 - sumR * sumR),
    ),
  );
  const correlation = round(Math.max(-1, Math.min(1, num / den)), 4);

  const msgBw = round(getMessageBandwidthKHz(fmKHz, shape), 2);
  const peakSidebandFreqKHz =
    sideband === 'USB' ? round(fcKHz + fmKHz, 2) : round(fcKHz - fmKHz, 2);

  return {
    samples,
    spectrum,
    receiverSpectrum,
    metrics: {
      messageBandwidthKHz: msgBw,
      occupiedBandwidthKHz: msgBw,
      activeToneFreqsKHz: toneFreqs,
      peakSidebandFreqKHz,
      peakSsbV: round(peakSsbV, 3),
      avgTxPowerMw,
      dsbFcPowerMw,
      powerSavedPercent,
      carrierSuppressionDb,
      sidebandSuppressionDb,
      rmseV,
      correlation,
      lpfRejectionDb,
    },
  };
}

export function buildSsbCsv(
  samples: SsbWaveformSample[],
  params: SsbParams,
): string {
  const header = [
    `# AM Studio SSB-${params.sideband} Simulation`,
    `# fm=${params.fmKHz}kHz, Am=${params.AmV}V, fc=${params.fcKHz}kHz, Ac=${params.AcV}V, shape=${params.shape}`,
    `# Receiver: df=${params.freqOffsetHz}Hz, dphi=${params.phaseErrorDeg}deg, lpf=${params.lpfCutoffKHz}kHz`,
    'time_ms,message_V,hilbert_V,carrier_V,ssb_V,envelope_V,mixer_V,recovered_V',
  ];
  const rows = samples.map((s) =>
    [
      s.time,
      s.message,
      s.hilbert,
      s.carrier,
      s.ssb,
      s.envelope,
      s.mixer,
      s.recovered,
    ].join(','),
  );
  return [...header, ...rows].join('\n');
}
