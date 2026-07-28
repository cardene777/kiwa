# solidjs リファレンス

## 公開 API

`mockSignal`、`mockEffect`、`batch`、`track` は状態依存を扱います。`createResourceStub` は pending、ready、errored、refreshing を扱います。`renderSolid`、`hydrate`、`createRoot`、`h` は軽量 tree を扱います。`invokeSolidRoute`、`renderWithSuspense`、`errorBoundary` は route と failure boundary を扱います。

## 設定

route は page、load、params、query を受け取ります。Suspense は component、fallback、`waitFor`、`timeoutMs` を受け取ります。timeout 時は resolved が `null` です。

## 結果の分岐

Signal の値、Effect の観測、Resource の pending と error は別の状態です。route の redirect は通常 response と異なるシグナルなので、表示結果だけで判定しません。

`renderWithSuspense` は fallback tree、resolved tree、timeout 状態を返します。timeout 時の resolved は null です。`errorBoundary` は component の throw を fallback と caught error を持つ signal にします。いずれも実 streaming や hydration を実行しません。

## 後始末と制約

effect と root の `dispose` を呼びます。これは Solid の実 owner tree やブラウザ hydration を再現せず、軽量 tree と signal の依存関係を扱います。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/solidjs/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [render.ts](./api/render) | 12 | 8 |
| [route.ts](./api/route) | 11 | 12 |
| [signal.ts](./api/signal) | 11 | 8 |

<!-- kiwa-public-api:end -->
