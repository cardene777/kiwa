---
title: kiwa の skill を使う
description: Claude Code に kiwa の skill を導入し、テスト設計から実行結果の確認までを進める。
---

# kiwa の skill を使う

kiwa のライブラリは、テストで使う runtime と、テストを設計・生成・レビューする Claude Code skill を分けています。`@kiwa-lab/form` のような package はアプリケーションの test から import します。`/kiwa:kiwa-form` のような skill は、その package を使う test のたたき台を作る入口です。skill が package を実行時に置き換えることはありません。

## 導入する

Claude Code で、対象プロジェクトを開いてから次を順に実行します。最初の二つは marketplace と plugin を登録し、最後の一つは現在の session に反映します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

導入後の skill 名には `kiwa:` が付きます。たとえば repository 内で `/kiwa-form` と表記される skill は、plugin を導入したプロジェクトでは `/kiwa:kiwa-form` と実行します。package を使う各ページでは、plugin 用の完全な名前でコマンドを示します。

## 実行する順序

仕様から test を作る layer 型の skill は、最初に `/kiwa:kiwa-design` で対象と検証層を指定します。出力された `tests/spec/` の仕様を、ライブラリまたは framework に対応する skill が読んで test file に変換します。最後に test runner を実行し、必要なら `/kiwa:kiwa-review` で生成物と結果を確認します。

```text
/kiwa:kiwa-design --layer unit --module signup
/kiwa:kiwa-vitest --module signup
pnpm exec vitest run
/kiwa:kiwa-review --mode test-review --module signup --layer unit
```

すべての library に専用 skill があるわけではありません。その場合も package の Quickstart で示す test を先に動かし、対象が unit、API、UI、e2e のどれかに応じて上の layer skill を選びます。各 library の Quickstart には、専用 skill が存在する場合の起動コマンドと、存在しない場合に手書きの test を選ぶ理由を記載します。

## 更新する

plugin の更新は marketplace のカタログ更新と plugin の更新を分けて行います。更新後は新しい session を開くか、`/reload-plugins` を実行してください。

```text
/plugin marketplace update kiwa-marketplace
/plugin update kiwa@kiwa-marketplace
/reload-plugins
```

skill は生成の入口です。生成した test は必ず対象ライブラリの Quickstart にある期待結果と照合し、実際のアプリケーションの provider や browser を使う箇所は、その integration test または e2e test で別に確認してください。
