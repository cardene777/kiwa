---
name: kiwa-nextjs
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md`) を Next.js Server Actions test (Vitest + @kiwa-test/nextjs) に変換する Layer 2 skill。
  `'use server'` async function を `invokeServerAction({ action, formData, cookies, headers, args })` 経由で direct invoke し、 redirect / cookie / header / revalidate の side-effect を捕捉して assertion 可能化する。
  `/kiwa-design --layer nextjs-server-action` が出力する 9 column 表を `@kiwa-test/nextjs` の `invokeServerAction` の引数に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-nextjs — Next.js Server Actions test 生成 (Layer 2)

`/kiwa-design --layer nextjs-server-action` が出力した `tests/spec/integration/test-spec-{module}.nextjs.md` の 9 column 表を、 `@kiwa-test/nextjs` v1.0+ の `invokeServerAction` を使った Vitest test に機械変換する。

App Router の **Server Actions (`'use server'` directive)** が対象。 React Server Components (RSC、 `--layer nextjs-rsc` 予定 #494) と `middleware.ts` (`--layer nextjs-middleware` 予定 #495) は本 skill のスコープ外。

## 前提

- 対象 example / project に Next.js App Router が存在 (`app/` directory)
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.nextjs.md`) が存在 (`/kiwa-design --layer nextjs-server-action` で生成)
- `@kiwa-test/nextjs` v1.0+ が install 済 (`pnpm add -D @kiwa-test/nextjs`)
- vitest + tsx + typescript の standard 開発環境

## オプション

- `--module {name}` — spec / test の module 名キー (1 起動 = 1 module)
- `--input-spec {path}` — Layer 1 spec の path (省略時は `tests/spec/integration/test-spec-{module}.nextjs.md`)
- `--output {path}` — 生成 test の path (省略時は `tests/integration/{module}.nextjs.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — 生成 test 内コメント言語 (省略時は `--input-spec` から自動判定)
- `--no-review` — Step 6 の `/kiwa-review --layer nextjs-server-action` 自動呼出を skip

## 実行フロー

### Step 1: Layer 1 spec の読込 + 9 column 表 parse

`tests/spec/integration/test-spec-{module}.nextjs.md` を Read し、 「テストケース一覧」 section の 9 column 表を行単位で配列に展開する。

期待する 9 column (`/kiwa-design --layer nextjs-server-action` の SSOT):

| 項目 | 内容 |
|---|---|
| ID | `T-NA-001` 等の連番 |
| Observation | 観点 (正常系 / 異常系 / 境界値 / 権限 / 冪等性 等) |
| Given | 初期 state (`cookies` / `headers` / 既存 DB row / fixture seed) |
| FormData | action に渡す FormData entries (key=value 形式) |
| Args | useFormState 等で formData 後ろに追加する extra args |
| Then | 期待 (`result.ok === true` / `env.redirect.url === '/dashboard'` / `env.cookies.get('session') === 'sid_X'` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Action | 対象 Server Action の identifier (`login` / `createPost` 等) |

### Step 2: action の import + injectable seam 確認

対象 Server Action の export を Grep で探す (`app/actions.ts` / `app/{path}/actions.ts` / `lib/actions/*.ts` 等)。 redirect / cookies / revalidatePath への依存は **injectable seam (parameter / module setter)** で書き換える必要がある (production の `redirect()` import を直接 throw する形では unit test 不可)。

seam 未整備の action を検出したら test 生成を中断し、 user に「Server Action を `(formData, env?)` 形式に refactor が必要」 を返す。 詳細パターンは `references/server-action-seam.md` 参照。

### Step 3: vitest test の生成

各 9 column 行を以下 template で test ブロックに変換 ...

```ts
import { describe, expect, it } from 'vitest';
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-test/nextjs';
import { {ACTION} } from '{ACTION_PATH}';

describe('{MODULE} server action', () => {
  it('{ID} {Observation}', async () => {
    const fd = new FormData();
    {FormData の各 entry を fd.set(key, value) に展開}
    const { result, error, env } = await invokeServerAction({
      action: {ACTION},
      formData: fd,
      cookies: {Given.cookies を object に展開},
      headers: {Given.headers を object に展開},
      args: {Args を配列に展開},
    });
    {Then を expect(...).toBe(...) 等に展開}
  });
});
```

### Step 4: test 実行 + 結果取得

`pnpm vitest run tests/integration/{module}.nextjs.test.ts --environment node` を起動。 fail 行を spec の対応 TC ID と紐付けて report する。

### Step 5: result-review 用 metadata の Write

`tests/reports/result/{module}.nextjs.{lang}.md` に以下を Write ...

- 実行日時 (skill 引数で渡された ISO 8601)
- spec 由来 TC 件数 / pass 件数 / fail 件数
- coverage (v8 で collect、 invokeServerAction の呼出有無で判定可能)
- 各 fail TC の Then 期待 vs 実際の env state diff

### Step 6: kiwa-review 自動呼出

`--no-review` 指定がなければ `/kiwa-review --mode test-review --layer nextjs-server-action --module {module}` を起動して 11 観点の cover 率を判定する。

## 11 観点 → invokeServerAction mapping

| 観点 | helper の使い方 |
|---|---|
| 正常系 | `formData` + `cookies` を seed → `result` が期待値 |
| 異常系 | 不正 `formData` → `error` instanceof Error + message check |
| 境界値 | FormData の値で boundary を試行 → `result` or `error` |
| 状態遷移 | `cookies` で state を表現 → action 後の `env.cookies.get(...)` で遷移を assert |
| 権限 | `headers.authorization` seed → action が `error` を throw or `result` が `unauthorized` |
| 入力バリデーション | 空 FormData → `error.message === 'required'` 等 |
| 冪等性 | 同 action を 2 回呼んで `env` 差分が 0 |
| 並行処理 | `Promise.all([invokeServerAction(...), ...])` で race 検出 |
| 性能 | `performance.now()` で wrap、 100ms 等の上限 assert |
| セキュリティ | CSRF token 不在 / 改竄 → `error` |
| 回帰 | 既知 bug 再現 FormData → `result` が正しい値 |

## 関連

- 上流 (Layer 1) ... `/kiwa-design --layer nextjs-server-action`
- runtime fixture ... `@kiwa-test/nextjs` v1.0+ (`packages/nextjs/`)
- 下流 (review) ... `/kiwa-review --layer nextjs-server-action`
- 統合 chain ... `/kiwa-test --target nextjs` (#493 完了後に追加予定)
- RSC test ... `/kiwa-nextjs-rsc` (#494、 別 PR)
- middleware test ... `/kiwa-nextjs-middleware` (#495、 別 PR)
- PoC ... `examples/nextjs-server-actions-poc/`
