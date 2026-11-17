# AM Studio — Interactive Amplitude Modulation Laboratory

A responsive, frontend-only laboratory for exploring amplitude modulation. This phase is a **static educational UI**: charts and results use bundled fixtures. There is no signal processing, FFT, demodulation, simulation clock, storage, or backend.

## Run locally

Use Node.js 22.12+ (or a compatible newer LTS) and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Navigation uses hash URLs, so refreshing a page works on static hosts without rewrite rules.

```sh
npm run build         # TypeScript checks and production output in dist/
npm run preview       # Serve the production build
npm run typecheck     # TypeScript project checks
npm run lint          # ESLint with TypeScript rules
npm run format:check  # Check Prettier formatting
npm run format        # Format source and configuration
```

No environment variables or API keys are needed. Commit `package-lock.json` with dependency changes so local and Vercel installations use the same dependency tree. The TypeScript ESLint parser and plugin are pinned together at 8.46.0, which supports TypeScript 5.9.3.

## Pages

- **Dashboard:** experiment cards, waveform illustrations, and the modulation process.
- **DSB-FC, DSB-SC, SSB-SC, VSB:** a consistent experiment workspace with Simulation, Theory & Equations, Frequency Analysis, and Demodulation tabs.
- **Modulation Comparison:** technique table and four illustrative spectra.
- **Demodulation:** receiver diagram, example waveforms, and envelope-detection explanation.
- **Theory & Equations:** six fundamentals cards, four mathematical models, and a notation reference.
- **Calculations:** editable fields beside fixed, explicitly labeled worked examples.
- **Export Data:** disabled CSV, PNG, and SVG export actions.
- Unknown URLs display a recovery page linking to the dashboard.

## Structure

```text
src/
├── app/                  # App, lightweight hash router
├── components/
│   ├── layout/           # AppShell, Sidebar, Topbar
│   ├── charts/           # WaveformChart, WavePlot, SpectrumChart
│   ├── simulation/       # ExperimentHeader, MetricsPanel, SignalControls
│   ├── ui/               # shadcn-style Button, Tabs, Switch, Dialog
│   ├── Equation.tsx      # KaTeX HTML + accessible MathML
│   └── FlowDiagram.tsx   # Modulation and receiver flows
├── data/                 # Experiment definitions and fixed signal fixtures
├── lib/                  # Tailwind class merging utility
├── pages/                # Dashboard, Experiment, Comparison, Demodulation,
│                         # Theory, Calculations, Export
├── styles/globals.css    # Tailwind, tokens, responsive component styles
└── main.tsx
public/favicon.svg
```

The UI uses React, TypeScript, Vite, Tailwind CSS, Radix-based shadcn-style components, Lucide, Recharts, and KaTeX. `components.json` configures shadcn aliases and styling. CSS uses Inter when installed, with system sans-serif fallbacks. All application data and assets are local; there are no runtime API calls.

## Presentation interactions

Sidebar navigation and collapse, the mobile drawer, keyboard-accessible tabs, chart expansion dialogs, stacked/overlay views, and USB/LSB fixture selection work. Sliders, dropdowns, and switches keep presentation state only. Display switches do not alter charts. The control-panel modulation dropdown previews controls; use sidebar links to change experiments. Switching experiments resets local presentation settings.

Run, reset, save, downloads, calculator execution, and exports are unavailable. Editable calculator fields never update the worked examples. Metrics are fixed reference values, including when a different SSB spectrum fixture is selected.

Spectra show positive frequencies only. DSB uses message bandwidth B = 1 kHz and carrier reference 10 kHz. The VSB example has a suppressed carrier and a 0.25 kHz vestige; other VSB variants may retain a carrier. Single-tone spectra illustrate components rather than continuous message bands.

## Verification and environment limits

- Production build, TypeScript, ESLint, and Prettier checks pass with locally available dependencies.
- Server-render smoke checks pass for all ten main destinations and the unknown-route fallback; theory output contains KaTeX and MathML.
- Browser layout, keyboard interaction, and responsive behavior still need browser verification. This sandbox blocked both a listening development server (`EPERM`) and Chromium startup.
- Registry access was blocked (`EAI_AGAIN`). Validation used existing local packages, cached archives, and locally bundled KaTeX. Dependency versions reflect available compatible packages; newest registry releases could not be verified. A clean registry installation and lockfile generation remain to be performed in a network-enabled environment. Use `npm install`, then commit the generated lockfile before team development.

## Simulation phase

Replace fixtures through the data/component boundary. Add typed signal parameters, modulation and filtering engines, FFT data, real demodulation, derived metrics, and input validation. Then connect transport/timing controls, define how reset behaves, implement actual calculations, session persistence, and real CSV/PNG/SVG export. Validate the numerical models and receiver behavior with dedicated scientific tests before connecting them to these displays.
