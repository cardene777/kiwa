# solidjs

`@kiwa-lab/solidjs` は、Signal、Effect、Resource、Solid route、Suspense、error boundary の契約を、Solid runtime を起動せずに検証する adapter です。画面を操作する代わりに、signal を読んだ effect、loader が返した data、route が送る redirect、resource の状態を直接 assertion します。

<img src="/images/kiwa-docs/frameworks/solidjs-overview.webp" alt="SolidJSのリアクティブ状態と非同期結果の関係" width="1200" height="675" loading="lazy" decoding="async">

## 検証できること

signal を effect の中で読むと、その signal の setter が変わったときだけ effect が再実行されます。複数の setter を `batch` で囲めば、途中の state ではなく最後の state に対して一度だけ再計算されたことを確認できます。`createResourceStub` は初回読込、再読込、失敗を `pending`、`refreshing`、`errored`、`ready` の状態として露出するため、非同期 UI の分岐を network なしで固定できます。

route を扱うときは `invokeSolidRoute` が loader と page を実行し、redirect、not found、通常の例外を別々の結果として返します。`renderWithSuspense` と `errorBoundary` は、fallback と解決済みの軽量 tree を assertion するための API です。

## 実環境との境界

この package は実 Solid の owner tree、browser の hydration、nested route matching、HTTP header を再現しません。effect は getter を直接読んだ signal だけを購読します。resource の fetch error は throw されず `accessor.error` に保存されます。Suspense は fallback を先に作り、待機 promise が timeout なら component を再描画しません。実 router や DOM の振る舞いは SolidStart と browser を含む統合 test で確認します。

## 読み進める

[Quickstart](./quickstart) で effect が再実行され、dispose 後には再実行されないことを確認します。[使い方](./how-to) では route、複数 signal、resource を扱います。個々の API と状態遷移は [リファレンス](./reference) にあります。SolidStart の server function は [solidstart](../solidstart/) を、framework に依存しない state は [state](../../application/state/) を参照してください。
