# react-native リファレンス

## API を選ぶ

通常は `createRNTestEnv` から始めます。platform、route、storage、linking を一つの test ごとに独立した状態で用意できるため、ログイン後の遷移のように複数の端末 API をまたぐ処理に向いています。AsyncStorage だけを対象にする unit test では `mockAsyncStorage`、navigation の stack だけを固定する test では `mockNavigation` を直接作れます。

URL をイベントとして流すときは `dispatchLinkingUrl` を使います。この API は route を決めません。URL の許可規則を test する場合は `matchDeepLink`、アプリ固有の route へ送る場合は listener 内の変換を組み合わせます。`setPlatform` と `setDimensions` は、同じ環境を作り直さずに OS と画面サイズの分岐を確認する API です。

## 設定

`createRNTestEnv` は `platform`、`version`、`initialRoute`、`asyncStorageInitial`、`initialUrl`、`window`、`screen` を受け取ります。

## 結果の分岐

Deep Link は受信履歴と navigation の更新を別々に確認します。AsyncStorage の値、現在 route、Platform 情報は env に格納され、listener 登録だけでは route が変わりません。

## 後始末と制約

Navigation listener は返り値の解除関数を呼んでください。これは React Native 本体や端末シミュレーターを起動せず、メモリ上の状態とイベント履歴だけを扱います。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>circuit-open</code> | [packages/react-native/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L202) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [async-storage.ts](./api/async-storage) | 1 | 2 |
| [dimensions.ts](./api/dimensions) | 1 | 1 |
| [env.ts](./api/env) | 1 | 3 |
| [extensions.ts](./api/extensions) | 8 | 16 |
| [linking.ts](./api/linking) | 1 | 2 |
| [navigation.ts](./api/navigation) | 1 | 2 |
| [platform.ts](./api/platform) | 1 | 1 |

<!-- kiwa-public-api:end -->
