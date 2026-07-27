# @kiwa-lab/react-native をはじめる

`@kiwa-lab/react-native` は、AsyncStorage、navigation、platform、dimensions、linking を一つの in-memory 環境で扱う test harness です。この Quickstart では、アプリを開いたときに保存済み token を読み、ログイン画面から Home へ遷移する流れを test します。シミュレーターや native module を起動せず、アプリケーションが受け取る状態と副作用を確認できます。

React Native の component を描画する library ではありません。gesture、native animation、OS の permission dialog、実機での Deep Link 配信は対象外です。それらは React Native Testing Library、Expo、または実機 E2E と組み合わせて確認します。

## 用意するもの

package と Vitest を追加します。既存の Vitest project では、React Native harness だけを追加してください。

```bash
pnpm add -D @kiwa-lab/react-native vitest
```

次に `tests/login-session.test.ts` を作ります。`createRNTestEnv` は test ごとに新しい storage と navigation stack を作るので、他の test の状態が漏れません。

## 保存済み session から Home へ進む

```ts
import { expect, it } from "vitest";
import { createRNTestEnv } from "@kiwa-lab/react-native";

it("保存済み token を読んで Home へ遷移する", async () => {
  const env = createRNTestEnv({
    platform: "ios",
    initialRoute: { name: "Login" },
    asyncStorageInitial: { token: "saved-token" },
  });

  const token = await env.asyncStorage.getItem("token");
  if (token !== null) env.navigation.navigate("Home", { source: "session" });

  expect(token).toBe("saved-token");
  expect(env.navigation.currentRoute()).toEqual({
    name: "Home",
    params: { source: "session" },
  });
  expect(env.navigation.history()).toEqual([
    { name: "Login" },
    { name: "Home", params: { source: "session" } },
  ]);
});
```

この test は、token があるときの route と history を同時に固定します。token がない場合の画面を test するなら、`asyncStorageInitial` を渡さずに別の `it` を作ります。環境には reset API がないため、同じ `env` を複数の test で共有しないでください。

## 実行して結果を確認する

```bash
pnpm exec vitest run tests/login-session.test.ts
```

成功すると一件の test が pass します。失敗時に最初に見るべき箇所は、初期 route と storage key です。native の keychain や secure storage そのものはこの harness では動かないため、本番で使うモジュールとの接続は別の統合テストで確認します。

## skill で test の下書きを作る

`/kiwa:kiwa-react-native` は platform 依存の test の下書きを作ります。初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-react-native --module login --platform ios --output tests/integration/login.rn.test.ts
```

生成後は、アプリが実際に使う storage key、route 名、platform ごとの差を置き換えます。生成物は仕様ではありません。次の command を実行し、状態遷移の assertion が pass することを確認します。

```bash
pnpm exec vitest run tests/integration/login.rn.test.ts
```

この command が失敗した場合は、まず生成された `initialRoute` と AsyncStorage の key を実際の画面実装に合わせます。画面を描画しないこの test と、gesture や native module を確かめる実機 test は分けてください。

## 次に進む

Deep Link、listener の解除、通知 permission、画面サイズの分岐は [使い方](./how-to) に進みます。環境に含まれる API は [リファレンス](./reference) で確認できます。
