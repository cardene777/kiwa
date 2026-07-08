# kiwa v1.16 released — Storybook 8 + Playwright CT + Chromatic (Component test 縦軸)

v1.16 is out. After v1.15's AI-LLM depth (`@kiwa/ai-llm` v0.2 multimodal + `@kiwa/mcp` v0.1 + `@kiwa/agent` v0.1), v1.16 turns to the **frontend component layer** that nearly every 2026 SaaS team ships: Storybook 8, Playwright Component Testing, and Chromatic — three integrations, one unified mock harness.

## What shipped

- **`@kiwa/component` v0.1** — three integrations under one API. `createStoryRegistry` implements Storybook 8 CSF3 (args deep merge + play function runner + `parameters.a11y` / `parameters.chromatic` passthrough + heuristic a11y checker for button-name / image-alt / label). `createPlaywrightCTMock` provides a Locator API subset (`mount + getByText + getByRole + click + fill + textContent + count`) without booting a real browser. `createChromaticVisualMock` implements a SHA-256 markup hash-based baseline / diff / accept-reject workflow with multi viewport and `parameters.chromatic.diffThreshold` support. Everything is framework agnostic: React / Vue / Svelte / Solid all reduce to `ComponentRender = (args) => MockNode`. 80 tests pass across `storybook.test.ts` (16) + `playwright-ct.test.ts` (13) + `chromatic.test.ts` (14) + `fixture.test.ts` (18) + `dom.test.ts` (19).
- **`examples/dogfood-storybook-design-system`** — 12 React design-system primitives (Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon), 30+ CSF3 stories, 53 tests + 3-layer perf gate PASS. A 6-op adapter contract (`registerAll` / `listStories` / `resolveArgs` / `mount` / `play` / `runA11y`) drives mock vs real behavioural fidelity into the 7-axis release gate (AI-LLM 4 axes not overlaid for component providers). Play functions dispatch via `fireEvent(node, {type, target})` and mock adapter instruments handler invocations to keep `metric.handlersInvoked` from double-counting registrations.
- **`examples/dogfood-form-ct`** — 5 form patterns (login / signup / checkout / profile / search) × 4 axes (mount / validation error / submit success / a11y violation 0) = 20 ops per adapter. 49 behavior tests + 4 flow perf ops PASS. `FormCTAdapter` unifies mock (in-memory MockNode canvas) and real (`PW_CT_ENDPOINT` env-skip) implementations; fidelity report emits to `quality-report/fidelity-latest.{json,md}` per canonical path.
- **`examples/dogfood-visual-regression`** — 10 UI scenes (5 primitives `card` / `modal` / `table` / `toast` / `form` × 2 themes light + dark). `VisualRegressionAdapter` covers `seedBaselines` / `captureOne` / `captureAll` / `review`. Diff-on-intent-change flips 1 visible bit (button label / heading rename / cell text) → FAIL; `review('accept')` restores baseline → PASS. 57 tests + 3-layer perf 4 ops PASS, coverage 92/88/95, mutation 73.33%. 7-axis release gate verdict PASS.
- **docs** — 3 new tutorials (19 Storybook 8 design system / 20 Playwright CT × 5 forms / 21 Chromatic 4-state machine) + additive migration guide v1.15 → v1.16 + concept doc `component-testing.md` documenting **3 surfaces × 6 semantic axes** (story registration / args resolution / interaction trace / a11y / snapshot hash / review workflow) as the SSOT. VitePress sidebar refreshed; gh-pages published.

## Numbers

- **6 sub-Issues resolved** (#763-#768)
- **6 PRs merged** (#769-#773 + this publish PR)
- **1 new package** (`@kiwa/component` v0.1.0)
- **3 new dogfood apps** with fidelity reports feeding the 7-axis release gate
- **80 unit tests** in the harness + **159 dogfood tests** (53 + 49 + 57) all pass

## 6-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → **v1.16 (component depth)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Framework depth (SolidJS / Fresh / HonoJS)
- Coverage 100% milestone
- Observability v2 (dashboard + alert + trace flame graph + log correlation)
- Blockchain depth (Reth Rust Ethereum execution client + Foundry-rs 深化 + dApp e2e 拡張)

Feedback welcome on which of these should land next.
