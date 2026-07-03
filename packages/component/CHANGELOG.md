# @kiwa-test/component

## 0.2.0

### Minor Changes

- 9b85ce4: feat: introduce `@kiwa-test/component` v0.1 — 3 統合統一 mock harness for Storybook 8 + Playwright Component Testing + Chromatic.

  - `createStoryRegistry` — Storybook 8 CSF3 互換の story registration + args resolution (meta / story deep merge) + play function runner + `parameters.chromatic` / `parameters.a11y` 透過 + heuristic a11y checker (button-name / image-alt / label rule)
  - `createPlaywrightCTMock` — Playwright CT の `mount + getByText + getByRole + click + fill + textContent + count` API 互換の in-memory locator (framework agnostic、 browser 起動なし)
  - `createChromaticVisualMock` — pseudo-HTML markup の SHA-256 hash に基づく baseline / diff / accept-reject workflow、 multi viewport + `parameters.chromatic.diffThreshold` 対応
  - 5 component fixture (`buildButton` / `buildInput` / `buildForm` / `buildModal` / `buildCard`) を共通 renderer として提供、 3 経路で同じ MockNode tree を扱える
  - 80 test pass (storybook / playwright-ct / chromatic / fixture / dom の 5 file、 Issue AC の 25+ を大幅超え)

  v1.16 milestone (Issue #762、 sub #763) の basis library。 後続の dogfood 3 app (design system / form CT / visual regression) がこの harness を利用する。
