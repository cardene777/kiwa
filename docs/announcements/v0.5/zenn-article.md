---
title: "kiwa v0.5 — contract / dApp e2e / 7 SPA framework のテストを 1 spec から生成する OSS toolchain"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "playwright", "vitest", "stryker"]
published: false
---

# 概要

dApp / smart contract / SPA を **1 つの spec から並列にテスト生成 + mutation gate enforce** できる OSS test toolchain `kiwa` を v0.5 まで仕上げました。

71 秒の overview 動画はこちらです (mp4 9.1MB)。

::: message
GitHub README に embed しています ... https://github.com/cardene777/kiwa
:::

```bash
npm install @kiwa-test/core
```

## 何が新しいか

直近 14 PR で v0.5 を出荷しました。 目玉は 3 点。

### 1. `@kiwa-test/ui` が 7 SPA framework + 実 Chromium browser に対応

1 npm package で次の 8 経路を同じ契約で扱えます。

| Framework | Helper | Underlying lib |
|---|---|---|
| React | `setupComponentEnv` | `@testing-library/react` |
| Vue 3 | `setupVueComponentEnv` | `@vue/test-utils` |
| Svelte | `setupSvelteComponentEnv` | `@testing-library/svelte` |
| SolidJS | `setupSolidComponentEnv` | `@solidjs/testing-library` |
| Lit (Web Components) | `setupLitComponentEnv` | `@open-wc/testing-helpers` |
| Qwik (resumable) | `setupQwikComponentEnv` | `@noma.to/qwik-testing-library` |
| Angular | `setupAngularComponentEnv` | `@testing-library/angular` |
| Browser (real Chromium) | `setupBrowserComponentEnv` | `@playwright/test` |

全 adapter が `mode (render / interaction / snapshot) + stop()` 契約を共有し、 `env.kind` で discriminate できます。 dynamic import + optional peer dep で利用者は使う framework だけ install すれば動きます。

```ts
import { setupVueComponentEnv } from "@kiwa-test/ui";

const env = await setupVueComponentEnv({
  mode: "interaction",
  component: VueCounter,
  props: { initial: 3 },
});
await env.wrapper.find("button").trigger("click");
expect(env.wrapper.find('[data-testid="value"]').text()).toBe("4");
await env.stop();
```

### 2. release workflow に mutation gate を物理 enforce

`scripts/check-mutation-gates.mjs` 新設で、 全 11 package の **Mutation Score Indicator (MSI)** を package 別 threshold で gate しています。 GitHub Actions の `release.yml` で 1 でも regression すると publish が止まります。

```bash
node scripts/check-mutation-gates.mjs
# All packages passed mutation thresholds.
```

| Package | MSI | Threshold |
|---|---|---|
| `@kiwa-test/api` | **96.06 %** | 90 |
| `@kiwa-test/a11y` | **93.62 %** | 90 |
| `@kiwa-test/ui` | **91.76 %** | 80 |
| `@kiwa-test/cli-test` | 89.69 % | 80 |
| `@kiwa-test/data` | 86.93 % | 80 |
| `@kiwa-test/spec` | 85.51 % | 80 |
| `@kiwa-test/core` | 85.09 % | 80 |
| `@kiwa-test/cli` | 84.44 % | 80 |
| `@kiwa-test/e2e` | 84.21 % | 80 |
| `@kiwa-test/observability` | 84.12 % | 80 |
| `@kiwa-test/visual` | 83.02 % | 80 |

#### 設計判断 ... なぜ package 別 threshold か

最初は全 package 一律 90 % を目指したのですが、 thin wrapper 系 (vue / solid / svelte / qwik / angular) は **equivalent mutant** が大量発生します。

たとえば Vue adapter は `@vue/test-utils` の `mount` を薄くラップしているだけで、 `wrapper.unmount()` 後の `wrapper` object 自体は valid (test-utils 仕様)、 `stop()` の block が空でも test pass してしまいます。

無理に 90 % へ引き上げるより、 pure-logic 系 (api / a11y / ui の setup-component-env + lit) で **90 % 強制**、 thin wrapper 系で **80 % 固定** とした方が ROI が高いという結論に。 実際 6 PR にわたる漸進的引き上げで全 package gate 通過しています。

### 3. Coverage + Mutation の 2 gate 機構化

release workflow は次の順で走ります。

```yaml
- name: Coverage gate (fail if any package < 90/80/90/90)
  run: node scripts/check-coverage-gates.mjs

- name: Mutation (all 11 packages)
  run: pnpm test:mutation

- name: Mutation gate (fail if any package MSI < per-package threshold)
  run: node scripts/check-mutation-gates.mjs
```

両 gate とも local でも走らせられます。

```bash
pnpm test:mutation
pnpm gate:coverage
pnpm gate:mutation
```

## どこで使うか

- **dApp** ... wallet UI / token explorer / NFT marketplace / DAO governance UI の test
- **smart contract** ... Foundry / Hardhat 両方を 1 spec から並列生成
- **enterprise web** ... Angular で書かれた金融 / B2B UI の component test
- **a11y / visual regression** ... `@kiwa-test/a11y` (axe-core) + `@kiwa-test/visual` (pixelmatch) も同じ chain で

## 試す

```bash
npm install @kiwa-test/core
# or
pnpm dlx @kiwa-test/cli init
```

詳細は README + Cookbook を参照してください。

- 📖 README ... https://github.com/cardene777/kiwa
- 💬 Discussions ... https://github.com/cardene777/kiwa/discussions
- 📦 npm ... https://www.npmjs.com/package/@kiwa-test/core

## 開発裏側 / 学び

直近の改善は dev-flow を AI assistant (Claude Code) で chain 化したことが効きました。 1 PR = 1 Issue を厳守して 14 PR を 2 日で merge できた背景には、 release workflow 側で gate を physical enforce している安心感があります。

「mutation gate を CI で走らせる」 は工数 high 認識でしたが、 stryker-mutator/vitest-runner で 1 package ≦ 30 秒、 全 11 package で 5-10 分。 release publish のたびに **regression を physical block できる** リターンを考えると十分に payoff します。

## まとめ

- 1 spec から contract / dApp e2e / 7 SPA framework / a11y / visual test を並列生成
- 全 11 npm package で MSI ≥ 80 を release workflow で物理 enforce
- 全 8 adapter (React / Vue / Svelte / Solid / Lit / Qwik / Angular + Chromium) を `@kiwa-test/ui` 1 package で

dApp / smart contract / SPA を test したい人にぜひ。 Issue / Discussion / リプライ歓迎です 🌱

---

🤖 関連投稿 ... [x.com thread](https://x.com/cardene777) / [Discussion](https://github.com/cardene777/kiwa/discussions)
