# @kiwa-lab/react-native の使い方

この手順では、許可した注文 Deep Link だけを route へ変換し、画面を離れた listener を解除し、通知 permission と Android の画面寸法を同じ mobile flow で確認します。この harness は URL を自動で route に変換しません。許可する URL と route 名、parameter 名はアプリケーションの仕様として test に書きます。

## mobile flow を test にする

次の内容を `tests/mobile-flow.react-native.test.ts` にそのまま保存してください。`dispatchLinkingUrl` は OS の Universal Link や Android App Link を起動せず、登録済み listener に URL event を渡します。navigation の `focus` listener は `unsubscribe` 後に後続 route を受け取りません。permission mock は dialog を表示せず、アプリが status をどう分岐するかを確認します。

```ts
import { expect, it } from "vitest";
import {
  createNotificationPermissionMock,
  createRNTestEnv,
  dispatchLinkingUrl,
  matchDeepLink,
  setDimensions,
  setPlatform,
} from "@kiwa-lab/react-native";

it("注文 Deep Link と画面 lifecycle と端末分岐を確認する", async () => {
  const env = createRNTestEnv({ initialRoute: { name: "Home" } });
  env.linking.listeners.push(({ url }) => {
    const match = matchDeepLink(url, [
      { scheme: "app", pathPattern: /^\/orders\/(\d+)$/ },
    ]);
    if (match.matched) {
      env.navigation.navigate("Order", { id: match.params?.p1 });
    }
  });

  dispatchLinkingUrl(env.linking, "app:///orders/42", 1_000);
  expect(env.navigation.currentRoute()).toEqual({
    name: "Order",
    params: { id: "42" },
  });
  dispatchLinkingUrl(env.linking, "app:///admin", 1_001);
  expect(env.navigation.currentRoute().name).toBe("Order");
  expect(env.linking.received).toHaveLength(2);

  const focused: string[] = [];
  const unsubscribe = env.navigation.addListener("focus", route => {
    focused.push(route.name);
  });
  env.navigation.navigate("Settings");
  unsubscribe();
  env.navigation.navigate("Profile");
  expect(focused).toEqual(["Settings"]);

  const permission = createNotificationPermissionMock("undetermined");
  expect(await permission.request()).toBe("granted");
  permission.set("denied");
  expect(permission.status()).toBe("denied");

  setPlatform(env.platform, { os: "android", version: 34 });
  setDimensions(env.dimensions, {
    window: { width: 412, height: 915, scale: 2.6 },
  });
  expect(env.platform).toMatchObject({ os: "android", version: 34 });
  expect(env.dimensions.window).toMatchObject({ width: 412, height: 915, scale: 2.6 });
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/mobile-flow.react-native.test.ts
```

成功時には、`app:///orders/42` だけが `Order` route へ進み、`app:///admin` は navigation を変えません。listener は `Settings` だけを受け、permission と platform の値はアプリケーションが分岐に使える状態になります。

## 実機へ分けること

この mock の `navigate`、`goBack`、`reset` は `focus` と `state` を発火しますが、`blur` は発火しません。gesture、native animation、safe area、orientation event、OS の permission dialog、通知 token、アプリが閉じた状態の initial URL、実際の Universal Link は simulator または実機 E2E の対象です。Expo SDK に依存する処理は [expo](../expo/) を使います。API の全項目は [リファレンス](./reference) を参照してください。
