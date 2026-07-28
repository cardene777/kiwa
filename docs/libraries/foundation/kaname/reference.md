# Kaname リファレンス

`@kiwa-lab/kaname` は仕様の分類と分割を提供します。

## 公開 API

`classify` は `SpecDoc` を受け取り、`ClassifyReport` を返します。`splitSpec` は同じ `SpecDoc` を受け取り、formal 用と runtime 用の Markdown、および件数を含む `SplitResult` を返します。入力 item の正確な shape はこのページ後半の API 契約を参照してください。

## 設定

各 item は `id`、`statement`、`layer`、`verifyBy` を持ちます。`classify` は重複 ID、空 statement、空 `verifyBy`、未知 layer、異なる layer 間の `verifyBy` 競合を報告します。重複 ID の後続 item は issue を一件追加して以降の分類処理を行わないため、`perLayer` には数えられません。

## 後始末

API は入力を変更しません。生成した Markdown file は project 側で管理します。`classify` は pure function で、`splitSpec` は文字列を返すだけです。

## 分割結果

`splitSpec` は `specFormal` と `specRuntime` のMarkdown文字列、ならびにtotal、formalCount、runtimeCount、humanCountを持つsummaryを返します。human itemはruntime文書側に残し、人手reviewの `verifyBy` を失わないようにします。split前にclassificationを要求しないため、無効な入力を出力へ渡さないよう呼び出し側でgateしてください。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [classify.ts](./api/classify) | 1 | 0 |
| [split.ts](./api/split) | 1 | 0 |
| [types.ts](./api/types) | 0 | 6 |

<!-- kiwa-public-api:end -->
