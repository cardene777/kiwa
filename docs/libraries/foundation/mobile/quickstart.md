# Mobile の導入

このガイドでは React Native component の lifecycle を状態遷移として検証します。これは JSX の実描画や native module の実行ではなく、テストで期待する操作履歴を確定するための API です。

## インストール

```bash
pnpm add -D @kiwa-lab/mobile
```

## 最小のテスト

```ts
import { describe, expect, it } from 'vitest';
import {
  invokeNativeModule,
  mountReactNativeComponent,
  recognizeGesture,
  unmountReactNativeComponent,
} from '@kiwa-lab/mobile';

describe('home screen', () => {
  it('records a native interaction', () => {
    const session = mountReactNativeComponent({
      target: 'android',
      componentId: 'home-screen',
    });

    invokeNativeModule(session, 'CameraModule');
    recognizeGesture(session, 'tap');
    unmountReactNativeComponent(session);

    expect(session.state).toBe('unmounted');
    expect(session.nativeModuleInvocations).toBe(1);
    expect(session.gesturesRecognized).toEqual(['tap']);
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'rn.component_mounted',
      'rn.native_module_invoked',
      'rn.gesture_recognized',
      'rn.component_unmounted',
    ]);
  });
});
```

`componentId` は空にできません。unmount 後の native module 呼び出しや gesture 認識は失敗し、二重 unmount も失敗します。component の実装テストでは、その失敗を避けるため lifecycle に合わせて session を作り直します。

## platform の使い分け

`target` は `ios`、`android`、`web` のいずれかです。状態遷移の `neutralEvent` は platform 間で共通ですが、`providerEvent` はそれぞれのネイティブ表現に対応します。platform ごとの差を検証する場合は `providerEvent`、共通の仕様を検証する場合は `neutralEvent` を使います。

この example を `tests/home.mobile.test.ts` に保存し、次を実行します。

```bash
pnpm exec vitest run tests/home.mobile.test.ts
```

成功すれば mount、native module、tap、unmount がこの順で記録されます。unmount 後の操作で失敗する場合は、同じ session を画面の次の test へ再利用していないかを確認してください。実 JSX の描画や native module の応答は、この session では確認しません。

## 次に読む

[使い方](./how-to) で navigation と CLI の境界を確認します。[リファレンス](./reference) には storage と real driver の条件をまとめています。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。skill を導入して仕様から test を組み立てる場合は、[kiwa の skill を使う](../../../guides/skills) の手順に従い、対象が unit、API、UI、e2e のどれかに応じて layer を選びます。専用 skill がないことは、実サービスの挙動を推測する生成物より、この library の公開 API と実装した test を先に確認するためです。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer unit --module mobile-session
/kiwa:kiwa-vitest --module mobile-session
```

生成後は、対象ファイルだけを実行します。

```bash
pnpm exec vitest run tests/home.mobile.test.ts
```
