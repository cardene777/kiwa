# @kiwa/component

## 0.3.0 — 2026-07-06

### Minor Changes — v1.34-1 advanced component 4 axis

- 4 new component semantic axes: rsc-harness (React Server Component render + suspense boundary + streaming HTML chunk), streaming-ssr (Suspense + ErrorBoundary + progressive hydration + selective hydration), view-transitions (element transition + document transition + animation testing), form-action-advanced (useFormStatus + useOptimistic + progressive enhancement).
- Fidelity harness added for 3 target × 4 axis = 12 rows across Storybook 8, Playwright Component Testing, and Chromatic, with target-specific event dialects.
- Real-driver env-gate (`KIWA_MODE=real` + `STORYBOOK_URL` / `PLAYWRIGHT_CT_URL` / `CHROMATIC_TOKEN`) reports mock vs real mode per target without adding runtime dependencies.

## 0.2.0

### Minor Changes

- 9b85ce4: feat: introduce `@kiwa/component` v0.1 — 3 統合統一 mock harness for Storybook 8 + Playwright Component Testing + Chromatic.

  - `createStoryRegistry` — Storybook 8 CSF3 互換の story registration + args resolution (meta / story deep merge) + play function runner + `parameters.chromatic` / `parameters.a11y` 透過 + heuristic a11y checker (button-name / image-alt / label rule)
  - `createPlaywrightCTMock` — Playwright CT の `mount + getByText + getByRole + click + fill + textContent + count` API 互換の in-memory locator (framework agnostic、 browser 起動なし)
  - `createChromaticVisualMock` — pseudo-HTML markup の SHA-256 hash に基づく baseline / diff / accept-reject workflow、 multi viewport + `parameters.chromatic.diffThreshold` 対応
  - 5 component fixture (`buildButton` / `buildInput` / `buildForm` / `buildModal` / `buildCard`) を共通 renderer として提供、 3 経路で同じ MockNode tree を扱える
  - 80 test pass (storybook / playwright-ct / chromatic / fixture / dom の 5 file、 Issue AC の 25+ を大幅超え)

  v1.16 milestone (Issue #762、 sub #763) の basis library。 後続の dogfood 3 app (design system / form CT / visual regression) がこの harness を利用する。
