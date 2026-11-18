import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { build } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const output = resolve('node_modules/.cache/am-studio-tests');
let studio;
before(async () => {
  // Compile through the existing Vite pipeline without starting a network server.
  await build({
    logLevel: 'error',
    build: {
      ssr: 'tests/render-entry.mjs',
      outDir: output,
      emptyOutDir: true,
      rollupOptions: {
        output: { manualChunks: () => undefined, entryFileNames: 'studio.mjs' },
      },
    },
  });
  studio = await import(pathToFileURL(resolve(output, 'studio.mjs')).href);
});
after(async () => {
  delete globalThis.window;
  await rm(output, { recursive: true, force: true });
});

const routes = [
  ['/', 'Find the signal.'],
  ['/experiments', 'Your experiment bench'],
  ['/experiments/dsb-fc', 'The envelope tells the story.'],
  ['/experiments/dsb-sc', 'More information per watt.'],
  ['/experiments/ssb-sc', 'Half the spectrum. The same message.'],
  ['/experiments/vsb', 'A practical middle ground.'],
  ['/comparison', 'Same message. Different approaches.'],
  ['/theory', 'Understand the signal.'],
  ['/demodulation', 'Bring the message home.'],
  ['/calculations', 'Worked example'],
  ['/export', 'No files are generated in this preview.'],
  ['/missing', 'SIGNAL NOT FOUND'],
];
for (const [path, content] of routes) {
  test(`renders ${path} with navigation, main content, and the correct page`, () => {
    globalThis.window = { location: { hash: `#${path}` } };
    const html = renderToStaticMarkup(createElement(studio.App));
    assert.ok(html.includes(content), `${path} must render its own content`);
    assert.ok(html.includes('aria-label="Main navigation"'));
    assert.ok(html.includes('id="main-content"'));
    if (path === '/experiments/ssb-sc') {
      assert.ok(html.includes('LIVE SSB SIMULATION'));
      assert.ok(html.includes('Phase discrimination (Hilbert)'));
      assert.ok(
        html.includes('katex-mathml'),
        'equations include accessible MathML',
      );
    } else if (path.startsWith('/experiments/')) {
      assert.ok(html.includes('FIXED REFERENCE DATA'));
      assert.ok(html.includes('Sliders change readouts only.'));
      assert.ok(
        html.includes('katex-mathml'),
        'equations include accessible MathML',
      );
    }
  });
}

test('reference samples are finite, ordered, and cover the stated 4 ms window', () => {
  const samples = studio.waveformData;
  assert.equal(samples[0].time, 0);
  assert.equal(samples.at(-1).time, 4);
  for (const [index, sample] of samples.entries()) {
    for (const value of Object.values(sample))
      assert.ok(Number.isFinite(value));
    if (index) assert.ok(sample.time > samples[index - 1].time);
  }
});

test('carrier suppression and selected SSB sidebands remain correct in reference spectra', () => {
  const positive = (data) => data.filter((point) => point.amplitude > 0);
  assert.deepEqual(
    positive(studio.spectra['dsb-fc']).map((p) => p.label),
    ['LSB', 'Carrier', 'USB'],
  );
  assert.deepEqual(
    positive(studio.spectra['dsb-sc']).map((p) => p.label),
    ['LSB', 'USB'],
  );
  assert.deepEqual(
    positive(studio.spectra['ssb-sc']).map((p) => p.frequency),
    [11],
  );
  assert.deepEqual(
    positive(studio.lsbSpectrum).map((p) => p.frequency),
    [9],
  );
  const lsb = renderToStaticMarkup(
    createElement(studio.SpectrumChart, { id: 'ssb-sc', sideband: 'LSB' }),
  );
  assert.ok(lsb.includes('LSB at 9 kHz'));
  assert.ok(!lsb.includes('USB at 11 kHz'));
});

test('VSB uses a labeled broadband schematic rather than an invented vestige tone', () => {
  const html = renderToStaticMarkup(
    createElement(studio.SpectrumChart, { id: 'vsb' }),
  );
  assert.ok(html.includes('vestige from 9.75 to 10 kHz'));
  assert.ok(html.includes('Total bandwidth 1.25 kHz'));
  assert.ok(html.includes('broadband schematic'));
});

test('conventional AM envelope detector covers under-modulation, 100%, and over-modulation regimes', () => {
  const under = studio.computeEnvelopeDetection({
    ...studio.DEFAULT_ENVELOPE_PARAMS,
    modulationIndex: 0.6,
  });
  assert.equal(under.metrics.modulationRegime, 'under');
  assert.ok(under.metrics.envelopeMinV > 0);
  assert.equal(under.metrics.phaseReversalFraction, 0);
  assert.ok(under.metrics.fidelityPct > 80);

  const critical = studio.computeEnvelopeDetection({
    ...studio.DEFAULT_ENVELOPE_PARAMS,
    modulationIndex: 1.0,
    rcTimeConstantMs: 0.12,
  });
  assert.equal(critical.metrics.modulationRegime, 'critical');
  assert.ok(Math.abs(critical.metrics.envelopeMinV) < 1e-6);
  assert.equal(critical.metrics.phaseReversalFraction, 0);

  const over = studio.computeEnvelopeDetection({
    ...studio.DEFAULT_ENVELOPE_PARAMS,
    modulationIndex: 1.5,
  });
  assert.equal(over.metrics.modulationRegime, 'over');
  assert.ok(over.metrics.envelopeMinV < 0);
  assert.ok(over.metrics.phaseReversalFraction > 0.15);
  assert.ok(over.metrics.rmseV > under.metrics.rmseV);
});

test('half-wave rectifier strictly passes s(t) > 0 and blocks s(t) < 0 while RC regime flags extremes', () => {
  const res = studio.computeEnvelopeDetection(studio.DEFAULT_ENVELOPE_PARAMS);
  for (const sample of res.samples) {
    assert.ok(sample.rectified >= 0);
    if (sample.modulated < 0) {
      assert.equal(sample.rectified, 0);
    } else {
      assert.equal(sample.rectified, sample.modulated);
    }
  }

  const tooSmallRc = studio.computeEnvelopeDetection({
    ...studio.DEFAULT_ENVELOPE_PARAMS,
    rcTimeConstantMs: 0.02,
  });
  assert.equal(tooSmallRc.metrics.rcRegime, 'too-small');

  const tooLargeRc = studio.computeEnvelopeDetection({
    ...studio.DEFAULT_ENVELOPE_PARAMS,
    rcTimeConstantMs: 1.2,
  });
  assert.equal(tooLargeRc.metrics.rcRegime, 'too-large');
});

test('demodulation page renders interactive envelope detector plots, controls, and Chapter 2 math', () => {
  globalThis.window = { location: { hash: '#/demodulation' } };
  const html = renderToStaticMarkup(createElement(studio.App));
  assert.ok(html.includes('Half-Wave Rectifier'));
  assert.ok(html.includes('RC Low-Pass Filter'));
  assert.ok(html.includes('Modulated AM Signal'));
  assert.ok(html.includes('Demodulated Output vs. Original Message'));
  assert.ok(html.includes('Modulation index'));
  assert.ok(html.includes('Time constant RC'));
  assert.ok(html.includes('katex-mathml'));
});

test('SSB phase-shift modulator suppresses carrier and unwanted sideband for USB and LSB', () => {
  const usb = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    fmKHz: 1.5,
    fcKHz: 10,
    AmV: 1.2,
    AcV: 1.0,
    sideband: 'USB',
  });
  const usbCarrier =
    usb.spectrum.find((p) => p.frequency === 10)?.amplitude ?? 0;
  const usbLower =
    usb.spectrum.find((p) => p.frequency === 8.5)?.amplitude ?? 0;
  const usbUpper =
    usb.spectrum.find((p) => p.frequency === 11.5)?.amplitude ?? 0;
  assert.ok(usbUpper > 0.55, `Expected USB peak near 0.6 V, got ${usbUpper}`);
  assert.ok(
    usbCarrier < 0.01,
    `Carrier should be suppressed, got ${usbCarrier}`,
  );
  assert.ok(
    usbLower < 0.01,
    `LSB should be suppressed in USB mode, got ${usbLower}`,
  );
  assert.ok(usb.metrics.sidebandSuppressionDb > 40);

  const lsb = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    fmKHz: 1.5,
    fcKHz: 10,
    AmV: 1.2,
    AcV: 1.0,
    sideband: 'LSB',
  });
  const lsbLower =
    lsb.spectrum.find((p) => p.frequency === 8.5)?.amplitude ?? 0;
  const lsbUpper =
    lsb.spectrum.find((p) => p.frequency === 11.5)?.amplitude ?? 0;
  assert.ok(lsbLower > 0.55, `Expected LSB peak near 0.6 V, got ${lsbLower}`);
  assert.ok(
    lsbUpper < 0.01,
    `USB should be suppressed in LSB mode, got ${lsbUpper}`,
  );
});

test('SSB coherent demodulator recovers message accurately under ideal lock and renders receiver workspace', () => {
  const ssbExp = studio.experiments.find((e) => e.id === 'ssb-sc');
  const rxHtml = renderToStaticMarkup(
    createElement(studio.DemodulationContent, { experiment: ssbExp }),
  );
  assert.ok(rxHtml.includes('LIVE COHERENT RECEIVER'));
  assert.ok(rxHtml.includes('LO frequency offset'));

  const ideal = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    shape: 'harmonic',
    sideband: 'LSB',
    phaseErrorDeg: 0,
    freqOffsetHz: 0,
    lpfCutoffKHz: 4.0,
  });
  assert.ok(
    ideal.metrics.rmseV < 0.02,
    `Ideal coherent RMSE should be < 0.02 V, got ${ideal.metrics.rmseV}`,
  );
  assert.ok(
    ideal.metrics.correlation > 0.999,
    `Ideal coherent correlation should be > 0.999, got ${ideal.metrics.correlation}`,
  );
  assert.ok(ideal.metrics.lpfRejectionDb > 50);

  const phaseErr = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    shape: 'tone',
    phaseErrorDeg: 90,
    freqOffsetHz: 0,
    lpfCutoffKHz: 4.0,
  });
  assert.ok(
    Math.abs(phaseErr.metrics.correlation) < 0.05,
    `90 deg phase error should rotate cosine to orthogonal sine, got r=${phaseErr.metrics.correlation}`,
  );

  const freqDrift = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    shape: 'tone',
    phaseErrorDeg: 0,
    freqOffsetHz: 200,
    lpfCutoffKHz: 4.0,
  });
  assert.ok(
    freqDrift.metrics.rmseV > 0.4,
    `200 Hz LO drift should raise RMSE substantially, got ${freqDrift.metrics.rmseV}`,
  );

  const highLpf = studio.simulateSsb({
    ...studio.DEFAULT_SSB_PARAMS,
    fcKHz: 10,
    lpfCutoffKHz: 24,
  });
  assert.ok(
    highLpf.metrics.lpfRejectionDb < 15,
    `High LPF cutoff should leak 2fc energy, got rejection=${highLpf.metrics.lpfRejectionDb}`,
  );

  const csv = studio.buildSsbCsv(ideal.samples, studio.DEFAULT_SSB_PARAMS);
  assert.ok(
    csv.includes(
      'time_ms,message_V,hilbert_V,carrier_V,ssb_V,envelope_V,mixer_V,recovered_V',
    ),
  );
});
