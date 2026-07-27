# @kiwa-lab/core

`@kiwa-lab/core` は、kiwa の adapter が同じ仕様を読み、同じ test resource の lifecycle を扱うための基盤 package です。HTTP、UI、dApp の test を直接実行するものではありません。仕様 Markdown を `SpecDoc` と `SpecCase` に変換する `parseSpec` と、起動コストの高い resource を借りて返す `createPool` を提供します。

![仕様解析と資源プールの流れ](/images/kiwa-docs/foundation/core-overview.png)

## 仕様を test の入力へ変換する

`parseSpec` は、module と layer の metadata、および最初に見つかった test case table を読みます。返る `SpecDoc` にはケースだけでなく warnings が入るため、仕様の列不足や未知の mode を無視せず、CI の失敗として扱うかを呼び出し側で決められます。仕様を実行したり、テストコードを生成したりはしません。

このため、kiwa-design が出力した仕様を adapter へ渡すときや、テストケース表を機械的に確認したいときに使います。単純な unit test で仕様 Markdown を扱わない場合は導入不要です。

## 高価な resource を安全に再利用する

`createPool` は Anvil、test server、browser のような resource を一定数だけ作り、test が `borrow` して `release` する仕組みです。release 時に `reset` を実行するので、次の test に前の状態を渡しません。suite の最後に `stopAll()` を呼ぶと、保持している resource を終了できます。

pool は runner や分散 queue ではありません。また `release` を忘れると次の borrower は空き slot を待ち続けます。resource の終了と state reset を明確に実装できる場合にだけ使ってください。

## 読み進める

[はじめる](./quickstart) では仕様 Markdown を解析して warnings を確認します。[使い方](./how-to) では pool の借用、失敗時の release、suite 終了時の cleanup を扱います。すべての型と API は [リファレンス](./reference) にあります。
