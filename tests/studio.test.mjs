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
    if (path.startsWith('/experiments/')) {
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
