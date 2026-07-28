# mobile

`@kiwa-lab/mobile` は、React Native と Expo のアプリケーションコードが期待するモバイル固有の操作を、OS に依存しない状態遷移として検証する library です。対象 platform は `ios`、`android`、`web` です。component の mount と unmount、native module、gesture、navigation、storage、New Architecture の操作履歴を memory 上に残し、実機を起動しなくてもアプリの分岐を確認できます。

<img src="/images/kiwa-docs/foundation/mobile-overview.webp" alt="モバイル操作のセッション境界" width="1200" height="658" loading="lazy" decoding="async">

## 実装が期待する操作順を固定する

component test は `mountReactNativeComponent` で session を始め、native module の呼び出しや gesture を記録し、最後に `unmountReactNativeComponent` で終了します。session の `history` には platform 共通の `neutralEvent` と、対象 platform に対応する `providerEvent` が残ります。共通の仕様を test するなら `neutralEvent`、iOS と Android の表現差を test するなら `providerEvent` を assertion します。unmount 後の操作や二重 unmount は失敗するため、画面の lifecycle を曖昧な成功として扱いません。

navigation は stack、tab、modal、deep link の意図を記録します。storage は Async Storage と secure storage に似た読み書きの結果を memory 内に残します。Fabric、Turbo Modules、codegen、New Architecture も、必要な準備を飛ばした操作が失敗する状態機械として扱います。これらは UI の見た目を test するためではなく、アプリコードが許す操作順と入力を検証するための API です。

## 実機を必要とする処理を明示的に分ける

通常の semantics API は React Native renderer、Expo Router、Metro、native module、simulator、device を実行しません。実 CLI を動かす必要がある場合だけ `invokeMobileCli` を使います。この経路は `KIWA_MOBILE_MODE=real` がなければ失敗し、許可された環境変数、timeout、出力 buffer の上限を適用します。`KIWA_MOBILE_SPAWN=dry-run` を指定すれば child process を起動せず、実行結果と同じ shape を test できます。

実 device、permission dialog、camera や push notification、performance、配布 build はこの library の対象外です。semantics API で操作順とエラー条件を先に固定し、実機または emulator の E2E で OS と framework の接続を確認してください。CLI の secret は command が明示的に許可する環境変数だけに渡し、任意の process 環境を引き継がせないでください。

## 読み進める

[Quickstart](./quickstart) では component lifecycle の最小 test を作ります。[使い方](./how-to) では navigation、storage、dry-run の CLI を扱います。全 API、state、real driver の前提は [リファレンス](./reference) にあります。
