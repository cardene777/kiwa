---
title: "kiwa v1.16 released — Storybook 8 + Playwright CT + Chromatic、 component test 縦軸"
emoji: "🌱"
type: "tech"
topics: ["oss", "typescript", "testing", "kiwa", "release"]
published: true
---

# kiwa v1.16 released

v1.16 は kiwa の 6 milestone 目です。 v1.15 (AI-LLM 深化、 multimodal / MCP / agent) の後、 v1.16 は 2026 SaaS frontend team のほぼ全てが導入済の **3 統合 (Storybook 8 + Playwright Component Testing + Chromatic) を 1 統一 mock harness に land** しました。

## 主な追加

### `@kiwa-test/component` v0.1

3 統合 (Storybook 8 + Playwright CT + Chromatic) を 1 API で扱う統一 mock harness。 framework agnostic な MockNode tree を 3 経路で共有します。

```ts
import {
  createStoryRegistry,
  createPlaywrightCTMock,
  createChromaticVisualMock,
  buildButton,
  buildForm,
  fireEvent,
} from '@kiwa-test/component';

// 1) Storybook 8 CSF3
const registry = createStoryRegistry();
registry.register({
  title: 'Components/Button',
  render: buildButton,
  args: { label: 'default' },
  stories: {
    Primary: { args: { variant: 'primary' } },
    Interactive: {
      args: { label: 'Click me' },
      play: async ({ canvasElement, step }) => {
        await step('click', async () => {
          const btn = canvasElement.getByRole('button');
          fireEvent(btn, { type: 'click', target: btn });
        });
      },
    },
  },
});
const { canvas } = registry.mount('Components/Button', 'Interactive');
const { steps } = await registry.play('Components/Button', 'Interactive', canvas);
// steps === [{ label: 'click', ok: true }]

// 2) Playwright Component Testing
const ct = createPlaywrightCTMock();
const page = ct.mount(buildForm({ kind: 'login' }));
await page.getByRole('textbox', { name: 'email' }).fill('a@b.com');
await page.getByRole('button', { name: 'submit' }).click();

// 3) Chromatic visual regression
const chromatic = createChromaticVisualMock();
chromatic.seedBaseline('Button-Primary', buildButton({ variant: 'primary' }));
const first = chromatic.capture('Button-Primary', buildButton({ variant: 'primary' }));
// first.status === 'passed'
const changed = chromatic.capture('Button-Primary', buildButton({ variant: 'secondary' }));
// changed.status === 'failed'
chromatic.review('Button-Primary', 'accept');
```

- Storybook 8 CSF3 = `createStoryRegistry` で meta / story args deep merge + play function runner + `parameters.a11y` / `parameters.chromatic` 透過 + heuristic a11y checker (button-name / image-alt / label rule)
- Playwright CT = `createPlaywrightCTMock` で `mount + getByText + getByRole + click + fill + textContent + count` の Locator API subset、 browser 起動なし
- Chromatic = `createChromaticVisualMock` で SHA-256 markup hash に基づく baseline / diff / accept-reject workflow、 multi viewport + `parameters.chromatic.diffThreshold`
- 5 component fixture (`buildButton` / `buildInput` / `buildForm` / `buildModal` / `buildCard`) は共通 renderer として提供、 3 経路で同じ MockNode tree
- 80 test pass (storybook 16 + playwright-ct 13 + chromatic 14 + fixture 18 + dom 19)

### dogfood-storybook-design-system

SaaS frontend 頻出 12 React primitive (Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon) を CSF3 `StoryObj` として 30+ story 定義。 6-op adapter (`registerAll` / `listStories` / `resolveArgs` / `mount` / `play` / `runA11y`) 経由で mock vs real の behavioural fidelity を実測、 7 軸 release gate に供給。

- 53 behavior test + perf 3-layer 1 spec 全 pass
- release gate PASS + `docs/quality-reports/component/storybook-design-system.md` land
- play function は `fireEvent(node, {type, target})` で発火、 mock adapter の `instrumentHandlers` で invocation を tick → `metric.handlersInvoked` (registration count 誤計測を回避)

### dogfood-form-ct

Playwright CT で 5 form pattern (login / signup / checkout / profile / search) × 4 axis (mount / validation error / submit success / a11y violation 0) = 20 op を統一 driver。 mock (in-memory MockNode canvas) + real (`PW_CT_ENDPOINT` env-skip) の 2 実装で fidelity 実測。

- 49 behavior test + 4 flow perf gate PASS
- login = email + password + rememberMe、 signup = 4 field (password === confirm)、 checkout = 5 field (`cardNumber` は `\d{12,19}`)、 profile = 3 field (URL well-formed)、 search = 2 field
- 7 軸 release gate verdict PASS

### dogfood-visual-regression

10 UI scene (5 primitive `card` / `modal` / `table` / `toast` / `form` × 2 theme light + dark) を `createChromaticVisualMock` で baseline seed → capture → diff-on-intent-change → accept-restores-baseline の 4 axis で駆動。 `intentChange=true` で 1 visible bit 変更 (button label / heading rename / cell text) → FAIL、 `review('accept')` で baseline を更新 → 次 capture は PASS。

- 57 test PASS (scenes 10 / seed 8 / capture 9 / diff-detect 7 / review-workflow 10 / e2e 7 / fidelity 5 / emit 1)
- 3-layer perf gate 4 op PASS (`seedAllBaselines` / `captureAllScenesNeutral` / `captureAllScenesChanged` / `acceptAllPendingChanges`)
- coverage 92/88/95、 fidelity 100% (3/3)、 perf p95 1.20 ms、 mutation 73.33%、 behavior 44 → 7-axis release gate PASS

### docs 3 pillars + concept doc

- Tutorial 19 (Storybook 8 design system) / 20 (Playwright CT × 5 form pattern) / 21 (Chromatic 4-state machine)
- Migration guide `v1.15 → v1.16` (additive-only、 既存 test は無変更で pass、 `@kiwa-test/component` v0.1 + 3 dogfood app 導入手順)
- Concept doc `docs/concepts/component-testing.md` — 3 surfaces (Storybook 8 + Playwright CT + Chromatic) × 6 semantic axes (story registration / args resolution / interaction trace / a11y / snapshot hash / review workflow) を SSOT 化
- VitePress sidebar 追記 (Component test (v1.16) section + concept doc link + migration link)
- `/docs-publish-kiwa` 経由 gh-pages 反映済

## 6 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → **v1.16 (component 縦軸)**。 v1.11 以降の全 milestone で 6 sub-Issue を full-land。

## v2.0 候補

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- Framework 深化 (SolidJS / Fresh / HonoJS)
- Coverage 100% milestone
- Observability v2 (dashboard + alert + trace flame graph + log correlation)
- Blockchain 深化 (Reth Rust Ethereum execution client + Foundry-rs 深化 + dApp e2e 拡張)

## まとめ

v1.16 は component test 縦軸 milestone。 v1.15 の AI-LLM 深化から frontend layer に射程を伸ばし、 SaaS frontend の必須 3 統合 (Storybook 8 + Playwright CT + Chromatic) を 1 統一 mock harness に land しました。 v1.11 - v1.16 で **37 sub-Issue 完遂 + 37 PR merge**、 kiwa の provider coverage は 6 milestone 連続で拡大しています。

Roadmap: https://github.com/cardene777/kiwa/issues/762
