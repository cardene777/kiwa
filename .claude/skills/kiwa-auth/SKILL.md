---
name: kiwa-auth
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/integration/test-spec-{module}.auth.md` を入力に、 `@kiwa-test/auth` を使う `test/*.auth.test.ts` を Write して `vitest` で動作確認する Layer 2 auth test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を NextAuth v5 (`setupNextAuthEnv`) / Lucia v3 (`setupLuciaEnv`) / Better Auth (`setupBetterAuthEnv`) の 3 backend に変換し、 session mock + OAuth provider mock + email/password + magic link + 2FA + passkey + organizations の 6 sub-feature を 1 spec で cover する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-auth — Layer 2 auth test skill

`/kiwa-design` (Layer 1) の `--layer auth` 出力を `test/*.auth.test.ts` に変換し、 `vitest` で動作確認する。 NextAuth v5 (Auth.js) / Lucia v3 / Better Auth の 3 backend を統一 surface で cover する Layer 2 skill。

`@kiwa-test/auth` v0.1 (v1.8-1〜v1.8-3、 Issue #637 / #638 / #639) の 3 factory (`setupNextAuthEnv` / `setupLuciaEnv` / `setupBetterAuthEnv`) を Layer 1 spec の観点別 TC 表から自動的に選択し、 session mock + provider mock + database adapter mock を組み立てる。

## 前提

- `@kiwa-test/auth` v0.1.0+ が devDependency に入っている (`pnpm add -D @kiwa-test/auth`)
- 対象の auth backend (NextAuth v5 / Lucia v3 / Better Auth) が peer dependency として入っている、 または backend 未指定なら 3 backend 全て試行
- Layer 1 spec (`tests/spec/integration/test-spec-{module}.auth.md`) が存在

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名 (`tests/spec/integration/test-spec-{name}.auth.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--backend {nextauth|lucia|better-auth|all}` — 生成対象 backend (default `all`、 3 backend 全てを 1 test file で cover)
- `--output {path}` — test file 出力先 (default `tests/{module}.auth.test.ts`)
- `--lang {ja|en|<ISO 639-1>}` — report 生成言語 (省略時は Step 0 で AskUserQuestion)
- `--no-run` — `vitest` 実行を skip (Write のみ)
- `--no-review` — Step 4 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

## 実行フロー

### Step 0: 文書生成言語 (skill 起動時 1 回)

AskUserQuestion で言語確認、 `--lang` 指定時 skip。 詳細 `references/doc-language-selection.md` (kiwa-design と共有 SSOT)。

### Step 1: Layer 1 spec 読込 + backend 判定

`tests/spec/integration/test-spec-{module}.auth.md` を Read、 各 TC の 「対象 backend」 column から NextAuth / Lucia / Better Auth のどれを組み立てるか判定する。 backend 未指定 TC は default `--backend` に従う。

### Step 2: test code 生成

TC 表を describe / it に落とす。 各 TC で `setupNextAuthEnv` / `setupLuciaEnv` / `setupBetterAuthEnv` のうち該当 factory を呼び、 期待結果を `expect()` にマッピングする。

生成テンプレ (backend = NextAuth v5、 session mock を通したい TC の場合):

```ts
import { setupNextAuthEnv } from "@kiwa-test/auth";
import { afterEach, describe, expect, it } from "vitest";

const envs: Array<{ stop(): Promise<void> }> = [];
afterEach(async () => {
  while (envs.length > 0) await envs.pop()!.stop();
});

describe("{module} — auth", () => {
  it("T-AUTH-001 authorises a valid session", async () => {
    const env = await setupNextAuthEnv({ providers: ["github"] });
    envs.push(env);
    const session = await env.signIn("github", { email: "alice@example.test" });
    expect(session.user.email).toBe("alice@example.test");
  });
});
```

### Step 3: vitest 実行

`pnpm vitest run {output_path}` で走らせる。 flaky 検出時は 3 回まで自動 rerun。

### Step 4: /kiwa-review test-review 自動呼出

`--no-review` 未指定なら `/kiwa-review --mode test-review --layer auth --module {module}` を chain 呼出。

## 完了条件

- test file が `{output}` に Write されている
- `vitest run` が exit 0
- kiwa-review test-review report が生成されている (`--no-review` 未指定時)

## 他 kiwa skill との chain 連携

- 上流 ... `/kiwa-design --layer auth` (Layer 1 spec 生成)
- 下流 ... `/kiwa-review --mode test-review --layer auth` (test 品質 review)
- 統合 ... `/kiwa-test --target auth` で Layer 1 → Layer 2 → review を 1 コマンド chain

## 関連

- `@kiwa-test/auth` v0.1 (v1.8-1〜v1.8-3、 Issue #637 / #638 / #639) SSOT
- `packages/auth/README.md` — 3 factory の API リファレンス
