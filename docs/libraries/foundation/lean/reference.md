# Lean リファレンス

`@kiwa-lab/lean` は遷移表の生成と Lean 4 による検証を提供します。

## 公開 API

`generateLeanSpec` は状態表から Lean source を生成します。`checkConformance` は observer で実装を全 cell 観測します。生成済み source を検証するには `checkLeanTable` と `extractLeanTable` を、Lean で elaboration を行うには `verifyLeanSpec` を使います。Lake project のファイルだけが必要な場合は `generateLakeProject` を使います。各引数と戻り値はこのページ後半の API 契約を参照してください。

## 設定

`OrchestratorSpec` はmodule名、namespace、states、events、transitionsを持ちます。未指定遷移は `unspecified` で扱います。`invalid` は表にないcellを拒否として埋め、`error` は未指定cellが一つでもあればspec errorにします。

## 後始末

Leanを実行するAPIはproject fileを作る場合があります。出力先をテストごとに分けます。`verifyLeanSpec` とtable extractionはLean binary、timeout、skip、output上限をstatusとして返すため、結果の種類を確認してください。

## 検証結果

`generateLeanSpec` はsource、推奨path、transition数、invalid transition数、terminal state、sink stateを返します。`checkLeanTable` はLean sourceの表とspecを全cellで比較し、sourceが検証できない場合も `ok: false` にします。実行を伴う非同期版は `verifyLeanSpecAsync`、`checkLeanTableAsync`、`extractLeanTableAsync` を使います。

`checkConformance` はspecの全状態×全eventをobserverへ渡し、実装が拒否した、specが拒否するeventを実装が受理した、異なるstateへ遷移した、未知stateへ遷移した、の4種類をreportします。observerの不正な戻り値は `UsageError` をthrowします。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [conformance.ts](./api/conformance) | 2 | 5 |
| [errors.ts](./api/errors) | 3 | 0 |
| [extract.ts](./api/extract) | 4 | 6 |
| [generator.ts](./api/generator) | 1 | 0 |
| [lake.ts](./api/lake) | 1 | 2 |
| [lean-runner.ts](./api/lean-runner) | 0 | 1 |
| [table.ts](./api/table) | 0 | 1 |
| [types.ts](./api/types) | 1 | 6 |
| [verify.ts](./api/verify) | 2 | 3 |

<!-- kiwa-public-api:end -->
