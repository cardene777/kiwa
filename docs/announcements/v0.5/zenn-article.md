---
title: "kiwa v0.5 — test stack 散乱を 1 spec で解決する polyglot test toolchain"
emoji: "🌱"
type: "tech"
topics: ["testing", "oss", "playwright", "vitest", "stryker"]
published: false
---

# 概要

「test stack が runner ごとに散らばってる」 を **1 つの Layer 1 spec** で解決する polyglot test toolchain `kiwa` を v0.5 まで仕上げました。

contract / API / component / e2e / a11y / visual を並列生成、 release workflow で Coverage + Mutation 両 gate を物理 enforce。 TypeScript / Python / Solidity を同じ chain で扱います。

80 秒の overview 動画はこちらです (mp4 7.1MB)。

::: message
GitHub README に embed しています ... https://github.com/cardene777/kiwa
:::

```bash
npm install @kiwa-test/core
# or
pip install kiwa-test-py
```

## なぜ作ったか — test stack 散乱問題

現代のアプリ開発では test が **runner ごとに散らばっています**。

- contract → Foundry / Hardhat
- unit + API → Vitest
- e2e → Playwright
- component → Testing Library (framework 別 fixture)
- a11y → axe-core
- visual → pixelmatch
- Python service → pytest

各 runner は独自の規約・fixture・gate を持ち、 **同じ test 観点を runner ごとに書き直す**羽目になります。 そして「stack 横断の単一ソース」 が存在しません。

kiwa は Layer 1 spec を hub にしてここを解決します。 1 つの 9 列 spec を書けば Layer 2 の generator が contract / API / component / e2e / a11y / visual の test code を並列出力します。

## 何が新しいか — v0.5 の 3 つの軸

直近 14 PR で v0.5 を出荷しました。 目玉は 3 点。

### 1. 6 surface × 8 component adapter

| Surface | 例 | adapter |
|---|---|---|
| Contract | Foundry / Hardhat / forge / Solidity | `@kiwa-test/spec` + skill chain |
| API integration | msw / supertest / Vitest | `@kiwa-test/api` |
| Component | React / Vue / Svelte / Solid / Lit / Qwik / Angular / Chromium | `@kiwa-test/ui` |
| E2E | Playwright + anvil + viem + EIP-6963 + ERC-4337 | `@kiwa-test/core` + `@kiwa-test/e2e` |
| A11y + Visual | axe-core / pixelmatch | `@kiwa-test/a11y` + `@kiwa-test/visual` |
| Data + CLI + Observability | queue / cron / shell IO / flaky 検出 | `@kiwa-test/data` + `@kiwa-test/cli-test` + `@kiwa-test/observability` |

`@kiwa-test/ui` だけで 8 framework + 実 Chromium に対応します。 全 adapter が `mode (render / interaction / snapshot) + stop()` 契約を共有し、 `env.kind` で discriminate できます。

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

dynamic import + optional peer dep なので、 利用者は使う framework だけ install すれば動きます。

### 2. polyglot (TypeScript / Python / Solidity)

kiwa の独自性は言語横断対応です。

- **TypeScript** ... 11 npm package (`@kiwa-test/{core, spec, api, ui, data, cli-test, e2e, a11y, visual, observability, cli}`)
- **Python** ... 1 PyPI package (`kiwa-test-py`、 `@kiwa-test/spec` の Python 移植 + requests / httpx adapter)
- **Solidity** ... Foundry / Hardhat 連携 (forge / chai-matchers / fast-check)

「default は TS だけど、 Python の microservice と Solidity の contract も同じ spec で test したい」 という現代の polyglot stack で力を発揮します。 Rust / Go は構想中。

### 3. release workflow で Coverage + Mutation 2 gate を物理 enforce

`scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` を新設し、 全 11 package の Coverage と MSI (Mutation Score Indicator) を release publish 経路で gate しています。

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

### 4. Coverage + Mutation の 2 gate 経路

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

## どこで使うか — polyglot な使い分け

- **dApp / smart contract** ... wallet UI / NFT marketplace / DAO governance UI の contract test + e2e、 Foundry + Hardhat + Playwright + anvil + viem の chain
- **REST API microservice (TS)** ... msw + supertest で contract test、 Vitest で unit
- **REST API microservice (Python)** ... pytest + requests/httpx で contract test
- **enterprise web (Angular / Vue)** ... `@kiwa-test/ui` の framework adapter で component test
- **CLI tool / queue worker** ... `@kiwa-test/cli-test` + `@kiwa-test/data` で shell IO + queue test
- **a11y / visual regression** ... axe-core + pixelmatch、 同 spec を共有して runner を増やさない

「stack ごとに runner も spec も書き直す」 が一気に消えるのが kiwa の効用です。

## 試す

```bash
npm install @kiwa-test/core
# Python service なら
pip install kiwa-test-py
# 一気に scaffold したい場合
pnpm dlx @kiwa-test/cli init
```

詳細は README + Cookbook を参照してください。

- 📖 README ... https://github.com/cardene777/kiwa
- 💬 Discussions ... https://github.com/cardene777/kiwa/discussions/451
- 📦 npm ... https://www.npmjs.com/package/@kiwa-test/core
- 🐍 PyPI ... https://pypi.org/project/kiwa-test-py/

## 開発裏側 / 学び

直近の改善は dev-flow を AI assistant (Claude Code) で chain 化したことが効きました。 1 PR = 1 Issue を厳守して 16 PR を 3 日で merge できた背景には、 release workflow 側で gate を physical enforce している安心感があります。

「mutation gate を CI で走らせる」 は工数 high 認識でしたが、 stryker-mutator/vitest-runner で 1 package ≦ 30 秒、 全 11 package で 5-10 分。 release publish のたびに **regression を physical block できる** リターンを考えると十分に payoff します。

「polyglot」 という看板は最初から掲げていたわけではなく、 `kiwa-test-py` を Python service の現場に出した時に「contract test の TC ID と spec section の表現が同じだと、 言語を跨いで思考できる」 と気づいたのが転換点でした。 言語ごとに独立した toolchain を維持するより、 **1 spec を common ground にする方が長期で楽** という確信に至りました。

## まとめ

- test stack 散乱問題を 1 Layer 1 spec で解決する polyglot test toolchain
- 6 surface (contract / API / component / e2e / a11y / visual + data / CLI / obs.) を 1 chain でカバー
- TypeScript (11 npm) + Python (1 PyPI) + Solidity (forge / hardhat) を同 spec から
- release workflow で Coverage + Mutation 2 gate を物理 enforce、 全 11 npm package で MSI ≥ 80
- `@kiwa-test/ui` 1 package で React / Vue / Svelte / Solid / Lit / Qwik / Angular + Chromium の 8 adapter

stack に test 散乱を感じる人にぜひ。 Issue / Discussion / リプライ歓迎です 🌱

---

🤖 関連投稿 ... [x.com thread](https://x.com/cardene777) / [Discussion #451](https://github.com/cardene777/kiwa/discussions/451)
