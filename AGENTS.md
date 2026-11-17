# Repository Guidelines

## Project Structure & Module Organization

This workspace is currently an initial scaffold: no application source, tests, assets, or package manifests are present. The `.agents/`, `.codex/`, `.aws/`, and `.git/` directories are environment metadata; do not use them for application code.

When adding the first implementation, group source code by feature or module. Consider `src/` for application code, `tests/` for automated tests, and `assets/` for static resources. Create directories only when needed, and document the chosen layout in `README.md`.

## Build, Test, and Development Commands

No build system, dependency manager, or development commands are configured yet. Do not assume commands such as `npm test` or `make build` are available.

When introducing tooling, document exact installation, local development, build, and test commands in `README.md`. Commit the relevant manifests and lockfiles so contributors can reproduce the environment.

## Coding Style & Naming Conventions

No language-specific style or formatter is established. Follow the conventions of the selected language and keep indentation consistent within each file. Use descriptive names that reflect a module's responsibility.

Add formatter and linter configuration alongside the first implementation, and document how to run both. Keep changes focused; avoid unrelated formatting edits.

## Testing Guidelines

No test framework or coverage threshold is configured. Introduce tests with executable code, covering expected behavior, boundary cases, and failure paths. Use descriptive test names and the selected framework's discovery conventions. Document test execution and any required fixtures.

## Commit & Pull Request Guidelines

Git history is unavailable in this workspace, so existing commit conventions cannot be verified. Use concise, imperative commit subjects, such as `Add modulation parser`.

Pull requests should explain the change, link relevant issues, and report validation commands and results. Include screenshots for visual changes and identify setup requirements or known limitations.
