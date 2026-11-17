import fixture from './waveform-fixture.json';
import type { ExperimentId } from './experiments';
// Fixed, bundled illustration samples. Controls never modify these fixtures.
export const waveformData = fixture;
export type SignalKey =
  'message' | 'carrier' | 'modulated' | 'suppressed' | 'single' | 'vestigial';
export const signalKeys: Record<ExperimentId, SignalKey> = {
  'dsb-fc': 'modulated',
  'dsb-sc': 'suppressed',
  'ssb-sc': 'single',
  vsb: 'vestigial',
};
export const spectra = {
  'dsb-fc': [
    { frequency: 8, amplitude: 0, label: '' },
    { frequency: 9, amplitude: 0.35, label: 'LSB' },
    { frequency: 10, amplitude: 1, label: 'Carrier' },
    { frequency: 11, amplitude: 0.35, label: 'USB' },
    { frequency: 12, amplitude: 0, label: '' },
  ],
  'dsb-sc': [
    { frequency: 8, amplitude: 0, label: '' },
    { frequency: 9, amplitude: 0.5, label: 'LSB' },
    { frequency: 10, amplitude: 0, label: '' },
    { frequency: 11, amplitude: 0.5, label: 'USB' },
    { frequency: 12, amplitude: 0, label: '' },
  ],
  'ssb-sc': [
    { frequency: 8, amplitude: 0, label: '' },
    { frequency: 9, amplitude: 0, label: '' },
    { frequency: 10, amplitude: 0, label: '' },
    { frequency: 11, amplitude: 0.5, label: 'USB' },
    { frequency: 12, amplitude: 0, label: '' },
  ],
  vsb: [
    { frequency: 8, amplitude: 0, label: '' },
    { frequency: 9.75, amplitude: 0.12, label: 'Vestige' },
    { frequency: 10, amplitude: 0, label: '' },
    { frequency: 11, amplitude: 0.5, label: 'USB' },
    { frequency: 12, amplitude: 0, label: '' },
  ],
};
export const lsbSpectrum = [
  { frequency: 8, amplitude: 0, label: '' },
  { frequency: 9, amplitude: 0.5, label: 'LSB' },
  { frequency: 10, amplitude: 0, label: '' },
  { frequency: 11, amplitude: 0, label: '' },
  { frequency: 12, amplitude: 0, label: '' },
];
