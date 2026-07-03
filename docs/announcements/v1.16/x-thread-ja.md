1/ kiwa v1.16 released。 Component test 縦軸 milestone です。 v1.15 (AI-LLM 深化、 multimodal / MCP / agent) の後、 v1.16 は 2026 SaaS frontend team のほぼ全てが導入済の 3 統合 (Storybook 8 + Playwright Component Testing + Chromatic) を 1 統一 mock harness に land しました。

2/ `@kiwa-test/component` v0.1 — 3 統合 1 API 統一。 `createStoryRegistry` (Storybook 8 CSF3 = args deep merge + play function runner + `parameters.a11y` / `parameters.chromatic` 透過 + heuristic a11y checker)、 `createPlaywrightCTMock` (mount + getByText + getByRole + click + fill + textContent + count Locator API subset)、 `createChromaticVisualMock` (SHA-256 markup hash baseline / diff / accept-reject workflow、 multi viewport)。

3/ framework agnostic MockNode tree — React / Vue / Svelte / Solid どれで書いても `ComponentRender = (args) => MockNode` に集約。 5 component fixture (`buildButton` / `buildInput` / `buildForm` / `buildModal` / `buildCard`) を 3 経路で共有、 同じ test で 3 統合を browser 起動なしで駆動。

4/ dogfood-storybook-design-system — SaaS frontend 頻出 12 React primitive (Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon)、 30+ CSF3 story、 53 test。 6-op adapter (`registerAll` / `listStories` / `resolveArgs` / `mount` / `play` / `runA11y`) で mock vs real の behavioural fidelity を実測、 7 軸 release gate に供給。

5/ dogfood-form-ct — 5 form fixture (login / signup / checkout / profile / search) × 4 axis (mount / validation / submit / a11y) = 20 op、 49 behavior test。 mock (in-memory MockNode canvas) + real (`PW_CT_ENDPOINT` env-skip) の fidelity 実測、 release gate PASS。

6/ dogfood-visual-regression — 10 scene (5 primitive × 2 theme) を baseline seed → capture → diff-on-intent-change → accept-restores-baseline の 4 axis で駆動。 57 test、 3-layer perf 4 op PASS、 coverage 92/88/95、 mutation 73.33%。 `createChromaticVisualMock` の review workflow は real Chromatic の accept / reject 遷移と同 shape。

7/ docs — tutorial 3 本 (19 Storybook 8 / 20 Playwright CT × 5 form / 21 Visual regression) + additive migration guide v1.15 → v1.16 + concept doc `component-testing.md` (3 surface × 6 semantic axis SSOT)。 VitePress sidebar + gh-pages 反映済。

8/ Roadmap: https://github.com/cardene777/kiwa/issues/762 — v1.16 sub-Issue #763-#768 全 resolve。 v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) の 6 milestone 連続完遂。 次 v2.0 候補 = multi-version Vitest matrix / Electron / Tauri + React Native / Expo adapter / framework 深化 (SolidJS / Fresh / HonoJS)。
