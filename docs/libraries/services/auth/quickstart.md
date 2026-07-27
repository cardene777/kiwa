# @kiwa-lab/auth はじめる

このページでは、NextAuth を使うアプリケーションの認可境界を一つ作ります。Google からプロフィールを受け取ったという前提でサインインし、アプリケーションがサーバー側で session を読めることを確認します。外部ネットワークや Google のテナントは使いません。そのため、この test は OAuth の接続確認ではなく、認証済みユーザーを受け取った後のアプリケーションの振る舞いを固定するためのものです。

## インストールする

```bash
pnpm add -D @kiwa-lab/auth @kiwa-lab/core vitest
```

`next-auth` は、実際の NextAuth の型や callback と一緒に test するときだけ追加します。ここで使う environment は `next-auth` を import しないため、認可ロジックだけを test する段階では追加不要です。

## 最初の認可テストを書く

`tests/kiwa/auth.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { afterEach, expect, it } from "vitest";
import { setupNextAuthEnv } from "@kiwa-lab/auth";

let env: Awaited<ReturnType<typeof setupNextAuthEnv>> | undefined;

afterEach(async () => {
  await env?.stop();
});

it("Google のサインイン後に session からユーザーを読める", async () => {
  env = await setupNextAuthEnv({
    providers: ["google"],
    session: { strategy: "jwt" },
  });

  const signed = await env.signIn("google", {
    email: "alice@example.test",
  });
  const session = await env.getSession(signed.session.sessionToken);

  expect(session?.user.email).toBe("alice@example.test");
});
```

## 実行する

```bash
pnpm exec vitest run tests/kiwa/auth.test.ts
```

成功すると、provider が返したプロフィールから user が作られ、その session token で同じ user を読めることが assertion で確認されます。token の文字列そのものを固定値として比較しません。アプリケーションの route や middleware が使う email、user ID、role のような認可判断の値を確認してください。

`afterEach` の `stop()` は、in-memory の user と session を破棄します。これを省くと、前の test の状態が次の test に残り、失敗時に認証処理と fixture のどちらが原因か判断しにくくなります。

## 次に進む

database session、Lucia、Better Auth、Clerk、Auth0、Supabase Auth を使う場合は、[使い方](./how-to) の一つの実行可能な recipe を使います。公開 API、既定値、失敗条件を調べるときは [リファレンス](./reference) を参照してください。実 IdP の redirect、Cookie 属性、hosted UI、実鍵の検証はこの mock の対象外です。test tenant を使う integration または E2E test を別に置きます。

<!-- skill-guide -->
## skill から test を作る

要件がすでに仕様として書かれている場合は、plugin を導入してから、次の順に実行します。一つ目の command が認証の仕様を作り、二つ目がその仕様を input に test の下書きを作ります。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer auth --module session
/kiwa:kiwa-auth --module session
```

生成物は下書きです。provider、認可条件、期待する失敗をこの Quickstart と照合し、生成された `tests/session.auth.test.ts` を次で実行してください。

```bash
pnpm exec vitest run tests/session.auth.test.ts
```

`/kiwa:kiwa-auth` は NextAuth、Lucia、Better Auth、Clerk、Auth0 の test を支援します。Supabase Auth は [使い方](./how-to) の `setupSupabaseAuthEnv` を起点に手書きで test を作ります。
