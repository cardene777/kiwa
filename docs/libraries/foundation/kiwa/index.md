# kiwa

kiwa は単一の npm package ではありません。アプリケーションの境界を test する library 群と、仕様から test を設計・生成・レビューする Claude Code skill 群をまとめた入口です。runtime はプロジェクトの test から import し、skill はその test を作る補助として使います。この二つを混同しないことが、kiwa を使い始めるときの最初の判断です。

## 何を揃えるか

kiwa は、仕様、test、実行結果の対応を残すための道具です。たとえば HTTP endpoint では request と response、UI では入力と表示状態、queue では投入と処理順、認証では session と拒否理由を、実装に合わせてそれぞれの library で検証します。一つの万能 mock を提供するものではなく、境界ごとに小さい in-memory harness を選ぶ設計です。

skill を使う場合は、最初に対象と期待結果を仕様として書き、その仕様を layer ごとの test に変換します。生成物も通常の source と同じように読んで、実装固有の分岐や本物の provider が必要な箇所を integration test または e2e test で確認します。

## どこから始めるか

まず対象の境界を決めます。HTTP API なら [api](../api/)、画面の操作なら [e2e](../e2e/)、component の入力と表示なら [ui](../ui/) が入口です。各ページの Quickstart は最小の test を実行するための手順で、使い方は実装で増えやすい分岐を扱います。

Claude Code で test の設計や生成も行う場合は、先に [kiwa の skill を使う](../../../guides/skills) を読み、plugin を導入してください。skill を使わず package だけを使う場合は、選んだ library の Quickstart から始められます。

## 読み進める

[はじめる](./quickstart) では plugin と runtime を導入して最初の test を動かします。[使い方](./how-to) では境界に応じた library と test 層の選び方を説明します。公開 surface と各要素の責務は [リファレンス](./reference) にまとめています。
