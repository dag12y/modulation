export type ExperimentId = 'dsb-fc' | 'dsb-sc' | 'ssb-sc' | 'vsb';
export interface ExperimentData {
  id: ExperimentId;
  number: string;
  name: string;
  fullName: string;
  description: string;
  carrier: string;
  sidebands: string;
  bandwidth: string;
  color: string;
  equations: string[];
  method: string;
  efficiency: string;
  insights: string[];
}
export const experiments: ExperimentData[] = [
  {
    id: 'dsb-fc',
    number: '01',
    name: 'DSB-FC',
    fullName: 'Double Sideband Full Carrier',
    description:
      'Discover conventional amplitude modulation. Explore how a message shapes a carrier and creates two symmetric sidebands.',
    carrier: 'Transmitted',
    sidebands: 'USB + LSB',
    bandwidth: '2 kHz',
    color: '#5175e9',
    equations: [
      String.raw`s(t)=A_c\left[1+\mu\cos(2\pi f_m t)\right]\cos(2\pi f_c t)`,
    ],
    method: 'Envelope detection',
    efficiency: 'Carrier consumes most power; ≤ 33.3% single-tone efficiency.',
    insights: [
      'Transmits the carrier and both sidebands.',
      'Bandwidth is twice the message bandwidth.',
      'Supports simple envelope detection for μ ≤ 1.',
      'Carrier transmission reduces power efficiency.',
    ],
  },
  {
    id: 'dsb-sc',
    number: '02',
    name: 'DSB-SC',
    fullName: 'Double Sideband Suppressed Carrier',
    description:
      'Put the information first. See a balanced pair of sidebands with the carrier removed from transmission.',
    carrier: 'Suppressed',
    sidebands: 'USB + LSB',
    bandwidth: '2 kHz',
    color: '#8b6bcb',
    equations: [String.raw`s(t)=A_c A_m\cos(2\pi f_m t)\cos(2\pi f_c t)`],
    method: 'Coherent detection',
    efficiency:
      'All transmitted power is in the information-bearing sidebands.',
    insights: [
      'Suppresses the carrier to conserve transmitted power.',
      'Transmits both information-bearing sidebands.',
      'Requires a phase-synchronized local carrier.',
      'Occupies twice the message bandwidth.',
    ],
  },
  {
    id: 'ssb-sc',
    number: '03',
    name: 'SSB-SC',
    fullName: 'Single Sideband Suppressed Carrier',
    description:
      'Less spectrum, the same message. Examine how transmitting just one sideband improves spectral efficiency.',
    carrier: 'Suppressed',
    sidebands: 'USB or LSB',
    bandwidth: '1 kHz',
    color: '#1c9c8e',
    equations: [
      String.raw`s_{\mathrm{USB}}(t)=\frac{A_c A_m}{2}\cos\left[2\pi(f_c+f_m)t\right]`,
      String.raw`s_{\mathrm{LSB}}(t)=\frac{A_c A_m}{2}\cos\left[2\pi(f_c-f_m)t\right]`,
    ],
    method: 'Coherent detection',
    efficiency: 'Single sideband uses less bandwidth and avoids carrier power.',
    insights: [
      'Transmits one sideband, with no carrier.',
      'Needs only the message bandwidth.',
      'USB and LSB carry the same message information.',
      'Requires accurate coherent detection.',
    ],
  },
  {
    id: 'vsb',
    number: '04',
    name: 'VSB',
    fullName: 'Vestigial Sideband',
    description:
      'Find a practical balance. Explore one full sideband and a carefully retained vestige of the other.',
    carrier: 'Suppressed*',
    sidebands: 'USB + vestige',
    bandwidth: '1.25 kHz',
    color: '#d7933b',
    equations: [
      String.raw`s_{\mathrm{VSB}}(t)=\left[m(t)\cos(2\pi f_c t)\right]*h_{\mathrm{VSB}}(t)`,
      String.raw`S_{\mathrm{VSB}}(f)=\tfrac12\left[M(f-f_c)+M(f+f_c)\right]H_{\mathrm{VSB}}(f)`,
    ],
    method: 'Coherent detection*',
    efficiency: 'Balances bandwidth savings with practical filter design.',
    insights: [
      'Transmits one complete sideband and a vestige.',
      'Requires message bandwidth plus the vestige width.',
      'Uses an asymmetric shaping filter.',
      'This example suppresses the carrier; other variants retain it.',
    ],
  },
];
export const getExperiment = (id: string | undefined) =>
  experiments.find((e) => e.id === id);
export const variables = [
  ['s(t)', 'Modulated signal', 'V'],
  ['m(t)', 'Message signal', 'V'],
  ['A_c', 'Carrier amplitude / multiplier', 'V / scaling'],
  ['A_m', 'Message amplitude', 'V'],
  ['f_c', 'Carrier frequency', 'Hz'],
  ['f_m', 'Message frequency', 'Hz'],
  ['\\mu', 'Modulation index', 'dimensionless'],
  ['h_{\\mathrm{VSB}}(t)', 'VSB filter impulse response', '—'],
];
export const theoryTopics = [
  {
    title: 'Amplitude modulation',
    label: 'THE BIG PICTURE',
    text: 'Amplitude modulation carries a low-frequency message by varying the amplitude of a higher-frequency carrier. The carrier moves the information into a band suitable for transmission.',
  },
  {
    title: 'Carrier & message signals',
    label: 'TWO SIGNALS, TWO ROLES',
    text: 'The message contains the information. The carrier provides the high-frequency reference. Here, our example uses a 1 kHz message and a 10 kHz carrier.',
  },
  {
    title: 'Understanding sidebands',
    label: 'WHERE INFORMATION LIVES',
    text: 'A single-tone message produces components at fc − fm and fc + fm. For a general message, these become frequency bands on either side of the carrier.',
  },
  {
    title: 'Modulation index',
    label: 'THE DEPTH OF MODULATION',
    text: 'For conventional single-tone AM, μ describes the depth of the envelope. At μ = 1, modulation reaches 100%. Above 1, envelope detection becomes distorted.',
  },
  {
    title: 'Bandwidth',
    label: 'MAKING ROOM IN THE SPECTRUM',
    text: 'DSB needs twice the message bandwidth B. SSB needs B. VSB occupies B plus a small vestigial bandwidth, depending on the filter.',
  },
  {
    title: 'Power efficiency',
    label: 'SPENDING POWER WISELY',
    text: 'The carrier itself contains no message information. Suppressing it improves power use. Suppressing one redundant sideband also saves spectrum.',
  },
];
