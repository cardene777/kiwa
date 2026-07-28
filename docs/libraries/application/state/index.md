# @kiwa-lab/state

`@kiwa-lab/state` は、state object、reducer、subscription、selector をプロセス内で検証する harness です。Zustand、Redux、Jotai、Valtio、MobX のprovider名を受け取りますが、各providerのruntimeを読み込むadapterではありません。

<img src="/images/kiwa-docs/application/state-overview.webp" alt="状態更新と購読解除のライフサイクル" width="1200" height="675" loading="lazy" decoding="async">

## 検証する流れ

`dispatch` は action を受け取り、更新前と更新後の snapshot、増加した version を返します。reducer を渡した store では reducer の結果が state になり、渡していない store では object payload が shallow merge されます。まずこの差分を確認してから、`subscribe` が同じ順序で通知され、解除後は通知されないことを検証してください。

selector、action creator、undo と redo、persistence は store の状態を読むか書くための追加機能です。保存や再試行を実サービスの代わりに行うものではないため、戻り値と記録された state を確認するテストに留めます。

## provider の意味

providerの既定値は `zustand` です。providerはsnapshotに記録されるdiscriminatorであり、dispatchの実行方法を切り替えません。reducerがあればreducerを呼び、なければobject payloadをstateへshallow mergeします。

## 使う場面

画面renderを含めずにreducer結果、selector、subscription解除、保存形式をtestするときに向いています。実providerのhook、proxy、devtools、render回数を確認する場合は対応frameworkのtest環境を使います。

## 最初の一歩

Redux 形式の reducer を使う最小 test は [はじめる](./quickstart) にあります。まず in-process store の state と通知を確認し、実 provider の hook、proxy、devtools、render 回数が必要になったときだけ framework の test environment に進んでください。

## 読み進める

[はじめる](./quickstart) でreducerを実行します。[使い方](./how-to) でsubscriptionとextensionを扱います。[リファレンス](./reference) で状態遷移の細部を確認します。
