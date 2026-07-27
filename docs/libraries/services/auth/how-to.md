# @kiwa-lab/auth を使う

認証 test で確かめるべきなのは、ログイン画面が表示されたことではなく、アプリケーションが認可に使う状態が正しく作られ、誤った状態を拒否することです。ここでは六つの environment を一つの file にまとめます。すべてを採用するための例ではありません。自分の認証基盤に対応する `it` を起点にして、API や middleware が必要とする email、role、organization、audience の assertion へ置き換えてください。

## provider ごとの認可境界を確認する

`tests/auth-provider-recipes.test.ts` を作り、次の内容を保存します。import、environment の後始末、実行対象の test を一つの file に含めているため、断片をつなぎ合わせる必要はありません。

```ts
import {
  createInMemoryAdapter,
  setupAuth0Env,
  setupBetterAuthEnv,
  setupClerkEnv,
  setupLuciaEnv,
  setupNextAuthEnv,
  setupSupabaseAuthEnv,
} from "@kiwa-lab/auth";
import { afterEach, describe, expect, it } from "vitest";

const environments: Array<{ stop(): Promise<void> }> = [];

function keep<T extends { stop(): Promise<void> }>(environment: T): T {
  environments.push(environment);
  return environment;
}

afterEach(async () => {
  await Promise.all(environments.splice(0).map((environment) => environment.stop()));
});

describe("authentication recipes", () => {
  it("keeps a NextAuth database session and removes it on sign-out", async () => {
    const database = createInMemoryAdapter();
    const nextAuth = keep(
      await setupNextAuthEnv({
        providers: ["github"],
        database,
        session: { strategy: "database" },
      }),
    );

    const signed = await nextAuth.signIn("github", { email: "alice@example.test" });
    expect((await database.getUserByEmail("alice@example.test"))?.id).toBe(signed.user.id);

    await nextAuth.signOut(signed.session.sessionToken);
    await expect(nextAuth.getSession(signed.session.sessionToken)).resolves.toBeNull();
  });

  it("keeps a Lucia password session bound to its user", async () => {
    const lucia = keep(await setupLuciaEnv({ database: { kind: "postgresql" } }));
    const signed = await lucia.signUpWithPassword({
      email: "alice@example.test",
      password: "correct-horse-battery-staple",
    });
    const validated = await lucia.validateSession(signed.session.id);

    expect(lucia.database.kind).toBe("postgresql");
    expect(validated?.user.email).toBe("alice@example.test");
    expect(validated?.session.userId).toBe(signed.user.id);
  });

  it("creates a Better Auth session when a magic link is consumed", async () => {
    const betterAuth = keep(
      await setupBetterAuthEnv({ plugins: ["emailAndPassword", "magicLink"] }),
    );
    const { token } = await betterAuth.sendMagicLink({ email: "alice@example.test" });
    const signed = await betterAuth.consumeMagicLink({
      email: "alice@example.test",
      token,
    });

    expect(signed.user.emailVerified).toBe(true);
    expect(signed.session.userId).toBe(signed.user.id);
  });

  it("exposes the Clerk organization role in a verified token", async () => {
    const clerk = keep(
      await setupClerkEnv({
        users: [{ primaryEmailAddress: "alice@example.test" }],
        orgs: [{ name: "Acme", slug: "acme", createdByEmail: "alice@example.test" }],
        tokens: [{ userEmail: "alice@example.test", organizationSlug: "acme" }],
      }),
    );
    const token = clerk.seededTokens["alice@example.test"]?.token;
    if (!token) throw new Error("seeded token missing");

    const claims = await clerk.verifyToken(token);
    expect(claims.sub).toMatch(/^user_/);
    expect(claims.org_role).toBe("owner");
    expect(claims.org_slug).toBe("acme");
  });

  it("checks the Auth0 API audience and custom role claim", async () => {
    const auth0 = keep(
      await setupAuth0Env({
        tenant: "kiwa-test",
        audience: "https://api.kiwa.test/",
        users: [
          {
            email: "alice@example.test",
            password: "pw-1",
            app_metadata: { role: "admin" },
          },
        ],
        actions: {
          "post-login": [(_event, api) => {
            api.accessToken.setCustomClaim("https://kiwa.test/roles", ["admin"]);
          }],
        },
      }),
    );
    const signed = await auth0.authenticate.signIn({
      email: "alice@example.test",
      password: "pw-1",
    });
    const claims = await auth0.verifyAccessToken(signed.access_token);

    expect(claims.aud).toBe("https://api.kiwa.test/");
    expect(claims["https://kiwa.test/roles"]).toEqual(["admin"]);
  });

  it("rejects a Supabase token issued by another environment", async () => {
    const supabase = keep(
      await setupSupabaseAuthEnv({
        users: [
          {
            email: "alice@example.test",
            password: "secret",
            emailConfirmed: true,
          },
        ],
      }),
    );
    const other = keep(await setupSupabaseAuthEnv());
    const { session } = await supabase.auth.signInWithPassword({
      email: "alice@example.test",
      password: "secret",
    });

    await expect(other.verifyToken(session.accessToken)).rejects.toThrow(/signature mismatch/);
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/auth-provider-recipes.test.ts
```

この file と同じ例は package の test としても実行されています。通れば、各 environment が作る state と、サインアウトまたは署名検証による拒否を確認できます。

## 各 test が確認すること

NextAuth の例は database strategy を選んでいます。`signOut` 後に session が読めないことまで確認することで、user の保存だけで認証済みと誤判定しないようにします。JWT strategy は stateless であり、同じ `signOut` が発行済み token を失効リストへ追加するわけではありません。実装の strategy に合わせて assertion を選びます。

Lucia の例では、password を登録してから session ID で user を取得します。アプリケーションが middleware で session を読み、そこから user を参照するなら、この対応関係が認可の土台になります。誤った password と未登録 email はともに `invalid email or password` になるため、画面や API が詳細を漏らさず同じ失敗として扱う test を追加できます。

Better Auth の magic link は plugin を有効にしたときだけ使えます。`sendMagicLink` と `consumeMagicLink` の間で token が一度だけ使われ、完了後に email verified の user と session が得られることを確認します。plugin を設定せずに呼ぶと必要な plugin が有効でない error になるので、magic link、TOTP、organization、passkey を使う test では setup の plugin 一覧も assertion と同じくらい重要です。

Clerk の例は、user ID だけでなく organization role と slug を token から読みます。organization 単位で API の認可をするアプリケーションでは、`sub` だけを確認してはいけません。role を変更した場合、owner 以外を拒否する handler の test も、この token を入力として追加します。

Auth0 の API は ID token ではなく access token を検証します。例では API audience と、post-login action が追加した namespace 付き role claim を確認しています。client ID 向けの ID token を API が受理してしまう事故を防ぐため、`verifyAccessToken` を使い、期待する audience と role を assertion に置きます。

Supabase Auth の例は、別 environment が発行した token を拒否します。これは別 project や異なる署名鍵で発行された token を API が認可しないことに対応します。成功だけでなく、署名検証の失敗をアプリケーションが `401` またはログイン要求へ変換する test を用意してください。

## 実環境へ渡す確認

これらの environment はアプリケーションが受け取る認証状態を再現します。OAuth redirect、hosted sign-in UI、Cookie の SameSite 属性、実 JWKS の取得と鍵ローテーション、メール配送、WebAuthn ceremony は再現しません。それらは test tenant を使う integration または browser E2E test で確認します。mock test を実環境の test で置き換えるのではなく、認可ロジックの高速な test と外部連携の test を分けて維持してください。

`provider was not configured` が出たときは setup 時の provider 一覧を確認します。`invalid email or password` は fixture の credential と seed user を、token の signature error は token の発行元と検証に使った environment を確認します。Auth0 の audience error は、API が期待する identifier と access token の `aud` を確認してください。
