export { default as App } from '../src/app/App';
export { SpectrumChart } from '../src/components/charts/SpectrumChart';
export { EnvelopeDetectorLab } from '../src/components/simulation/EnvelopeDetectorLab';
export {
  DEFAULT_ENVELOPE_PARAMS,
  computeEnvelopeDetection,
  computeOptimalRcMs,
} from '../src/lib/envelopeDetector';
export { experiments } from '../src/data/experiments';
export { waveformData, spectra, lsbSpectrum } from '../src/data/mockSignals';
