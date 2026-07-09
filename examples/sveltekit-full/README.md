# sveltekit-full — kiwa SvelteKit PoC (v1.0.x 全 3 helper)

`@kiwa-lab/sveltekit` v1.0.x の **3 helper 全部** (`invokeLoad` / `invokeAction` / `invokeHandle`) を **実 SvelteKit project** に統合した参考実装。

OSS contributor / kiwa を初めて触る user 向けに、 `+page.server.ts` の `load` / `actions` / `hooks.server.ts` の `handle` の 3 layer をどう書けば kiwa 経由で test できるかを **コピペで動く形** で示す。

## 構造

```
sveltekit-full/
├── svelte.config.js               # SvelteKit config (adapter-auto)
├── vite.config.ts                 # Vite + SvelteKit plugin (port 3040)
├── src/
│   ├── app.d.ts                   # App.Locals 定義
│   ├── app.html                   # SvelteKit root HTML
│   ├── hooks.server.ts            # 実 SvelteKit handle hook (thin wrapper)
│   ├── lib/_kiwa/auth-handle.ts   # kiwa-testable pure handle
│   └── routes/
│       ├── +page.svelte           # トップ page (PoC 説明 + link)
│       ├── login/
│       │   ├── +page.svelte
│       │   └── +page.server.ts    # session cookie 設定用 (test fixture)
│       └── items/
│           ├── +page.svelte       # items 一覧 + create form
│           ├── +page.server.ts    # thin wrapper (load + actions)
│           └── _kiwa/
│               ├── items-load.ts     # kiwa-testable pure load
│               └── items-actions.ts  # kiwa-testable pure action
├── tests/
│   ├── items-load.test.ts         # invokeLoad 8 test
│   ├── items-actions.test.ts      # invokeAction 6 test
│   ├── auth-handle.test.ts        # invokeHandle 5 test
│   └── e2e/sveltekit-server.spec.ts  # Playwright e2e (real `vite dev` 経由)
├── playwright.config.ts           # Playwright config (webServer auto-launch vite dev :3040)
├── package.json
├── tsconfig.json
└── tsconfig.vitest.json
```

## 設計原則 — Pattern A (Dependency Injection)

実 SvelteKit 側 (`src/routes/items/+page.server.ts` / `src/hooks.server.ts`) は **thin wrapper のみ** にして、 SvelteKit runtime に依存する binding 処理を集約する。 ロジック本体は `_kiwa/*.ts` に切り出し、 kiwa の `SimulatedLoadEvent` / `SimulatedActionEvent` / `HandleArgs` 経由で external 依存 (cookies / fetch / locals 等) を受ける形式に統一する。

これにより ...

| layer | 実 SvelteKit 経路 | kiwa test 経路 |
|---|---|---|
| `+page.server.ts` load | `export const load = (event) => itemsLoad(event)` で thin wrap + kiwa redirect/error signal を `@sveltejs/kit` の `redirect()` / `error()` に翻訳 | `invokeLoad` で simulated event を直接 inject + `data` / `redirect` / `error` / `env.responseHeaders` を全捕捉 |
| `+page.server.ts` actions | `export const actions = { create: async (e) => ... }` で kiwa fail signal を `@sveltejs/kit` の `fail()` に翻訳 | `invokeAction` で formData / cookies / locals を inject + `result` / `fail` / `redirect` / `env.cookies` を全捕捉 |
| `hooks.server.ts` handle | `export const handle = (args) => authHandle(args)` で thin wrap | `invokeHandle` で `resolveResponse` を inject + `response` / `resolveCalled` / `localsAtResolve` を全捕捉 |

## 実行方法

### Step 1 — install + build

```bash
pnpm install               # repo root から実行
pnpm -F examples-sveltekit-full build  # 依存 @kiwa-lab/sveltekit + @kiwa-lab/core を先に build
```

### Step 2 — kiwa unit test (SvelteKit 起動不要、 高速)

```bash
pnpm -F examples-sveltekit-full test
# → 19 test (8 + 6 + 5) 全 pass、 数百ms で完了
```

3 helper を使った 19 test が pass し、 each layer の動作仕様を SvelteKit / Vite runtime なしで確認できる。

### Step 3 — Playwright e2e (real `vite dev`)

```bash
pnpm -F examples-sveltekit-full exec playwright install chromium  # 初回のみ
pnpm -F examples-sveltekit-full test:e2e
# → Playwright が自動で `vite dev --port 3040` を起動 + 4 e2e spec を実行
```

実 SvelteKit + 実 Vite + 実 Svelte runtime の統合動作を end-to-end で確認する。 各 e2e spec は kiwa unit test と **同じ振る舞いを実 server で検証** する形になっており、 unit test と e2e が同じ実装を別 angle で test する 2 軸構成。

### Step 4 — `/kiwa-design → /kiwa-sveltekit → /kiwa-review` chain (skill 経由)

```bash
/kiwa-design --layer sveltekit-page-server --module items
# → tests/spec/integration/test-spec-items.sveltekit.md (9 column 表) 生成

/kiwa-sveltekit
# → 上記 spec から invokeLoad / invokeAction を使った Vitest test を自動生成

/kiwa-review --mode test-review --layer sveltekit-page-server --module items
# → 生成 test の 11 観点網羅判定 + 不足観点提案
```

同様に `--layer sveltekit-hooks-server` でも skill chain 動作確認可能。

## kiwa SvelteKit helper を覚える順序 (初心者向け)

1. **`invokeLoad`** (`+page.server.ts` の load) — 最も理解しやすい、 cookies / params / url / locals seed + redirect / error / responseHeaders capture
2. **`invokeAction`** (`+page.server.ts` の actions) — formData seed + fail / redirect / error / cookies capture
3. **`invokeHandle`** (`hooks.server.ts` の handle) — request middleware、 `resolve()` callback 注入で downstream 経路を fake 化、 locals injection 観測

各 helper の API 詳細は [`@kiwa-lab/sveltekit` の README](../../packages/sveltekit/README.md) を参照。

## 関連

- 上位 Issue ... [#525](https://github.com/cardene777/kiwa/issues/525) (v1.2 examples/* full server PoC)
- 親 PR ... 本 PR (`feature/525-2-sveltekit-full-poc`、 5 framework sub-task の 2 つ目)
- 関連 PR ... [#543](https://github.com/cardene777/kiwa/pull/543) (Nuxt full PoC、 sub-task 1/5)
- 関連 skill ... `/kiwa-design --layer sveltekit-page-server` / `/kiwa-sveltekit` / `/kiwa-review`
