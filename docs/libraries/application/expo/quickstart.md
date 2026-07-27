# @kiwa-lab/expo をはじめる

`@kiwa-lab/expo` は、Expo Router、SecureStore、通知、file system、camera を一つの in-memory 環境にまとめる test harness です。この Quickstart では、ログインで session を保存して注文画面へ進み、logout 相当の reset で残してはいけない state を消す流れを確認します。Expo Go、実端末、EAS build は起動しません。

## インストール

```bash
pnpm add -D @kiwa-lab/expo vitest
```

## session の開始と終了を test にする

次の内容を `tests/order-session.expo.test.ts` にそのまま保存してください。test ごとに `ExpoTestEnv` を作るため、router 履歴と保存値が他の test へ漏れません。ここではアプリケーションが使う storage key と route を固定します。

```ts
import { expect, it } from "vitest";
import { createExpoTestEnv } from "@kiwa-lab/expo";

it("session を保存して注文へ進み、reset で消す", async () => {
  const env = createExpoTestEnv({
    router: { initialPath: "/home" },
    secureStore: { initial: { theme: "dark" } },
  });

  await env.secureStore.setItemAsync("session", "token-1");
  env.router.push("/orders/5", { source: "login" });

  expect(await env.secureStore.getItemAsync("session")).toBe("token-1");
  expect(env.router.getCurrentPath()).toBe("/orders/5");
  expect(env.router.getCurrentParams()).toEqual({ source: "login" });
  expect(env.router.getHistory()).toEqual([
    { type: "push", path: "/orders/5", params: { source: "login" } },
  ]);

  env.reset();

  expect(await env.secureStore.getItemAsync("session")).toBeNull();
  expect(env.router.getCurrentPath()).toBe("/home");
  expect(env.router.getHistory()).toEqual([]);
  expect(await env.secureStore.getItemAsync("theme")).toBeNull();
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/order-session.expo.test.ts
```

成功時には、session と router 操作が記録され、`reset` 後は initial SecureStore 値を含めて消えます。`reset` は router を initial path へ戻します。実機の Keychain や Keystore に token が保存されたこと、通知が OS から配信されたことは証明しません。

## 次に行うこと

通知 payload からの route 分岐、camera permission、capture file の cleanup は [使い方](./how-to) で扱います。native permission dialog、実端末の push token、画像の品質、端末固有 URI、EAS update は実機または development build の統合 test で確認してください。

<!-- skill-guide -->
## skill で test を作る

`/kiwa:kiwa-expo` は Expo SDK 依存の test の下書きを作れます。初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-expo --module onboarding --sdk router --output tests/integration/onboarding.expo.test.ts
```

生成後は、実際の route、storage key、permission が拒否されたときの遷移先を仕様に合わせて直し、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/integration/onboarding.expo.test.ts
```

SDK ごとの引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-expo/SKILL.md) を参照してください。
