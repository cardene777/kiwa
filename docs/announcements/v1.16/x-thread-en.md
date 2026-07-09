1/ kiwa v1.16 is out — Component test vertical. After v1.15's AI-LLM deepening (multimodal / MCP / agent), v1.16 lands the frontend layer nearly every 2026 SaaS team ships: Storybook 8 + Playwright Component Testing + Chromatic, all under one unified mock harness.

2/ `@kiwa-lab/component` v0.1 — one API for three integrations. `createStoryRegistry` (Storybook 8 CSF3: args deep merge + play function runner + `parameters.a11y` / `parameters.chromatic` passthrough + heuristic a11y checker), `createPlaywrightCTMock` (mount + getByText + getByRole + click + fill + textContent + count Locator API subset), `createChromaticVisualMock` (SHA-256 markup hash baseline / diff / accept-reject workflow, multi viewport).

3/ Framework agnostic MockNode tree — React / Vue / Svelte / Solid all reduce to `ComponentRender = (args) => MockNode`. Five component fixtures (`buildButton` / `buildInput` / `buildForm` / `buildModal` / `buildCard`) share the same tree, so the same test drives all three integrations without browser boot.

4/ dogfood-storybook-design-system — 12 React design-system primitives (Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon), 30+ CSF3 stories, 53 tests. Adapter 6-op contract (`registerAll` / `listStories` / `resolveArgs` / `mount` / `play` / `runA11y`) drives mock vs real behavioural fidelity into the 7-axis release gate.

5/ dogfood-form-ct — 5 form patterns (login / signup / checkout / profile / search) × 4 axes (mount / validation / submit / a11y) = 20 ops, 49 behavior tests. Mock (in-memory MockNode canvas) + real (`PW_CT_ENDPOINT` env-skip) fidelity measured, release gate PASS.

6/ dogfood-visual-regression — 10 scenes (5 primitives × 2 themes) through baseline seed → capture → diff-on-intent-change → accept-restores-baseline. 57 tests, 3-layer perf 4 ops PASS, coverage 92/88/95, mutation 73.33%. `createChromaticVisualMock` review workflow mirrors real Chromatic accept / reject transitions.

7/ docs — 3 tutorials (19 Storybook 8 / 20 Playwright CT × 5 forms / 21 Visual regression) + additive migration guide v1.15 → v1.16 + concept doc `component-testing.md` (3 surfaces × 6 semantic axes SSOT). VitePress sidebar refreshed; gh-pages published.

8/ Roadmap: https://github.com/cardene777/kiwa/issues/762 — v1.16 sub-Issues #763-#768 all resolved. v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth): 6 milestones in a row. Next v2.0 candidates: multi-version Vitest matrix, Electron / Tauri + React Native / Expo adapters, framework depth (SolidJS / Fresh / HonoJS).
