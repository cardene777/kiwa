---
name: kiwa-auth
description: @kiwa-lab/auth を使い、認証済み状態と認可境界を確認する Vitest を作成して検証する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# kiwa auth

`@kiwa-lab/auth` の test environment を使い、アプリケーションが認証後に受け取る user、session、token、organization の状態を test します。実 IdP の redirect、hosted UI、Cookie 属性、JWKS の取得を置き換える skill ではありません。それらは test tenant を使う integration または E2E test に残します。

## 入力

`$ARGUMENTS` で対象 module または既存の仕様 file を受け取ります。仕様 file が与えられたら、書かれている認可規則、失敗時の応答、外部サービスとの境界を先に読みます。曖昧な認可規則は推測せず、利用者に確認します。

## 選ぶ environment

| 認証基盤 | environment | test で固定する状態 |
| --- | --- | --- |
| NextAuth | `setupNextAuthEnv` | provider、JWT または database session、adapter |
| Lucia | `setupLuciaEnv` | password、OAuth、session validation |
| Better Auth | `setupBetterAuthEnv` | password、magic link、plugin、organization |
| Clerk | `setupClerkEnv` | user、organization、JWT claim |
| Auth0 | `setupAuth0Env` | access token、audience、action、role claim |
| Supabase Auth | `setupSupabaseAuthEnv` | password session、access token、token verification |

一つの test file では、アプリケーションが実際に採用している認証基盤だけを作成します。異なる environment を共有せず、各 test の終了時に `await env.stop()` を実行します。

## 実装する

公開 entry point と既存の代表 test を確認してから、対象 module の test file を作ります。正常系では、認可に使う user ID、email、role、organization、audience のどれかを assertion にします。失敗系では、未設定 provider、無効な password、別 environment が発行した token、organization の権限不足のうち、その module に関係する条件を一つ以上確認します。

test は `afterEach` または `try` と `finally` で cleanup します。session token やランダム ID の文字列を固定値で比較せず、アプリケーションが判断に使う claim と状態遷移を確認します。

## 実行して確認する

生成した file だけを Vitest で実行します。たとえば出力先が `tests/session.auth.test.ts` なら、次を実行します。

```bash
pnpm exec vitest run tests/session.auth.test.ts
```

失敗した場合は、まず environment の設定と assertion を照合します。`provider was not configured` は setup 時の provider 一覧を、`invalid email or password` は fixture の credential を、token の signature または audience error は発行元 environment と API が期待する audience を確認します。実 IdP だけで再現する失敗は mock の設定を増やさず、integration test に切り分けます。

## 出力する

作成または更新した test file、選んだ environment、確認した認可境界、実環境で別途確認する項目を短く報告します。生成後の test が通らない場合は、通ったと扱いません。
