# @kiwa-lab/auth

`@kiwa-lab/auth` は、認証サービスの SDK を呼ばずに、サインイン、セッション、プロバイダー、データベースアダプターの境界を Vitest で検証するためのテストアダプターです。NextAuth、Lucia、Better Auth、Clerk、Auth0、Supabase Auth をそれぞれ独立した環境として扱います。

<img src="/images/kiwa-docs/services/auth-overview.webp" alt="認証環境を作成してサインインとセッション取得を検証し停止する流れ" width="1774" height="887" loading="lazy" decoding="async">

## 対象にする境界

このパッケージは認証後にアプリケーションが観測できる結果をテストします。たとえば、プロバイダーから返るプロフィール、発行されたセッション、サインアウト後の状態、データベースアダプターへの書き込みです。実際の OAuth リダイレクトやホストされたログイン画面を操作するものではありません。

| 利用中の認証基盤 | 作る環境 | 主に確認すること |
| --- | --- | --- |
| NextAuth v5 | `setupNextAuthEnv` | provider、JWT または database session、Adapter |
| Lucia v3 | `setupLuciaEnv` | password、OAuth、rolling session、SQLite または PostgreSQL 形状 |
| Better Auth | `setupBetterAuthEnv` | password、magic link、TOTP、organization、passkey |
| Clerk | `setupClerkEnv` | user、session、organization、JWT |
| Auth0 | `setupAuth0Env` | token、Management API、rule、action |
| Supabase Auth | `setupSupabaseAuthEnv` | password、OAuth、PKCE、OTP、access token、refresh token |

## 使う場面

認証済みのユーザーだけが API や画面へ進めること、プロバイダーごとに同じアカウントが結び付くこと、サインアウトで database session が削除されることを高速に確認するときに使います。アプリケーションの認可ロジックを、外部 IdP の可用性、料金、テスト用テナントの状態から切り離せます。

## 使わない場面

実際の IdP とブラウザ間のリダイレクト、Cookie の SameSite 属性、ホスト画面の UI、実鍵による federation を確認する用途には向きません。その範囲はテスト用テナントを使った integration または E2E テストで確認します。`@kiwa-lab/auth` の環境は SDK の利用側が期待する状態と操作を再現するためのものです。

## 実行の単位

`setup*Env` はテストごとに新しい environment を返します。environment を共有する場合は、共有する in-memory adapter を明示して渡します。各 environment は最後に `stop()` で停止します。失敗したテストでも後始末されるよう、Vitest の `afterEach` で await してください。

## 利用の流れ

[はじめる](./quickstart) では NextAuth の provider と session を最小の test で結びます。[使い方](./how-to) では database strategy、Lucia、Better Auth、Clerk、Auth0、Supabase を provider ごとに分け、アプリが認可判断に使う state を確認します。[リファレンス](./reference) では各 environment と設定を確認します。実 IdP の redirect、cookie、鍵、hosted UI を確認する case は、これらの mock test を置き換えず実テナントの integration または E2E に追加してください。
