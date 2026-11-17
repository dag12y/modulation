# AM Studio V2 — Hybrid Instrument Studio

An alternative frontend for the AM Studio amplitude modulation laboratory. Light educational pages surround a dark scientific instrument workspace. All plots are **static teaching illustrations**. There is no modulation engine, FFT, filtering, demodulation, backend, authentication, storage, or simulation clock.

## Versions and Git

- **Version A:** the original AM Studio interface, preserved at `1e1bef0f830327761b3e544b5182aa2faef3aa46` (`Preserve original AM Studio interface`).
- **Version B:** the Hybrid Instrument Studio interface, developed on `design/hybrid-instrument-studio` and merged into `main`.

`main` now uses Version B. Version A remains available in Git history at the commit above, and the design branch is retained as the source of the redesign. Both versions use the same Vite static build and hash routes. Neither version has been deployed.

## Run locally

Use Node.js 22.12+ and npm. With existing dependencies:

```sh
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`. Open the instrument directly at `http://localhost:5173/#/experiments/dsb-fc`.

On a fresh checkout:

```sh
npm ci
npm run dev
```

No environment variables or API keys are needed. Commit `package-lock.json` with dependency changes so local and Vercel installations use the same dependency tree. The TypeScript ESLint parser and plugin are pinned together at 8.46.0, which supports TypeScript 5.9.3.

```sh
npm test              # Route rendering, accessible equations, and fixture checks
npm run typecheck     # TypeScript project checks
npm run lint          # ESLint
npm run format:check  # Prettier
npm run format        # Format source and configuration
npm run build         # TypeScript + production build in dist/
npm run preview       # Serve the production build locally
```

Hash URLs support refreshes on static hosts without routing rewrites. Production output is self-contained in `dist/`.

## Design and pages

- **Shell:** compact expandable navigation rail, mobile drawer, contextual toolbar, disabled Run/Reset placeholders, and a display-preferences dialog. Higher grid contrast is a working, visit-only preference.
- **Dashboard:** editorial introduction, an oscilloscope illustration, four distinct spectrum signatures, and a signal-processing flow.
- **Experiments:** DSB-FC, DSB-SC, SSB-SC, and VSB share a single instrument bench. Large stacked/overlay traces, three visibility toggles, scope expansion, a spectrum analyzer, and a grouped parameter bank sit on one dark surface. A light mathematical model, key insight, signal explanations, and characteristics follow below.
- **Comparison:** four spectrum previews lead the page. Bandwidth bars share a common 2 kHz scale. The educational comparison table follows.
- **Theory & equations:** ruled field notes, KaTeX models, and a notation reference.
- **Demodulation:** a conceptual receiver flow and independent fixed received/recovered traces.
- **Calculations:** a dark parameter panel beside fixed worked examples. Editable inputs do not calculate results.
- **Export data:** a coordinated light/dark page with disabled CSV, PNG, and SVG actions.
- Unknown routes show a recovery page.

The palette uses cyan for message signals, violet for carriers, lime for modulated signals, amber for spectrum carriers, and cyan for sidebands. Scope geometry, grid density, typography, and controls avoid animated signal activity and decorative glow.

## Presentation interactions and limits

Navigation, Radix tabs, the mobile drawer, display preferences, signal visibility, scope expansion, stacked/overlay selection, and USB/LSB spectrum selection work. Sliders update their readouts only. Every waveform remains a bundled fixed fixture; no slider changes a chart.

SSB selects an alternative **spectrum fixture** and mathematical model; its time trace remains fixed. Frequency-domain diagrams show positive frequencies only. DSB/SSB use single-tone components with a 10 kHz carrier reference and 1 kHz message. VSB uses a separate, explicitly labeled broadband schematic with one full 1 kHz sideband and a 0.25 kHz vestige; it is not a computed spectrum of the adjacent time trace. The VSB example suppresses its carrier; other variants can retain it.

Run, reset, calculations, saving, and export remain unavailable. Preferences and parameter readouts are not persisted. Native range inputs support keyboard and touch. Motion follows `prefers-reduced-motion`. Dialogs use Radix focus management and Escape handling. Equations include accessible MathML and scroll within their panels when needed.

## Structure

```text
src/
├── app/                    # Existing app and hash router
├── components/
│   ├── layout/             # AppShell, compact Sidebar, contextual Topbar
│   ├── charts/             # WavePlot, WaveformChart, SpectrumChart
│   ├── simulation/         # Instrument controls; retained legacy UI modules
│   ├── ui/                 # Reused Radix-based primitives
│   ├── Equation.tsx        # KaTeX HTML and MathML
│   └── FlowDiagram.tsx     # Modulator/receiver diagrams
├── data/                   # Existing typed experiment metadata and fixed fixtures
├── pages/                  # All existing destinations
├── styles/globals.css      # Shared foundation and reference-page layout
├── styles/hybrid.css       # Version B system, composition, and responsive rules
└── main.tsx
tests/                      # Node test runner + Vite server-render checks
public/favicon.svg          # Local vector mark
```

Existing routing, experiment metadata, fixtures, KaTeX rendering, Recharts, and Radix components are retained. The V2 stylesheet loads after the shared foundation; it also restyles every reference page. No runtime network calls or external visual assets were added.

## Verification and local review

TypeScript, lint, production build, formatting, route-render checks, and fixture consistency checks are run for the redesign. Tests compile an isolated server-render bundle into ignored `node_modules/.cache/am-studio-tests` and clean it afterward. Server rendering verifies content and semantics; it does not verify Recharts geometry or browser interactions.

This execution environment blocks listening ports (`EPERM`) and Chromium startup. Browser screenshots, measured overflow, keyboard interaction, and viewport rendering therefore require local review. The user will open the application locally.

Suggested review sizes: **1440, 1024, 768, 390, and 320 px**. Check each experiment, comparison, theory, receiver, calculations, and export. Confirm:

1. Charts remain legible; mobile analyzers and learning panels stack.
2. Tab/Shift+Tab reaches navigation, tabs, signal toggles, sliders, and expansion controls. Arrow keys adjust native sliders and Radix tabs.
3. Drawer and scope dialogs trap focus, close with Escape, and return focus.
4. Readout changes leave traces fixed. SSB changes only the selected spectrum illustration and model.
5. Long equations scroll inside their panel, and the page has no horizontal overflow.
6. Display preferences increase grid contrast; reduced motion disables transitions.

The installed KaTeX package includes WOFF2 fonts. Vite also reports missing legacy WOFF/TTF fallbacks already referenced by the local package stylesheet; modern browser WOFF2 assets are emitted successfully. A clean dependency installation and browser review remain before deployment or user evaluation.
