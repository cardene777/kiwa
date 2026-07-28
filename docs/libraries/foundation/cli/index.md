# @kiwa-lab/cli

`@kiwa-lab/cli` は、kiwa の dApp テストをプロジェクトへ導入し、仕様から test の下書きを作り、再利用できる Anvil state を用意する command-line tool です。実行 command は `kiwa` です。Playwright と `@kiwa-lab/dapp` を手で配線する前に、必要な config と最初の test の形をそろえたい場合に使います。

<img src="/images/kiwa-docs/foundation/cli-overview.webp" alt="CLI がテスト基盤を準備する流れ" width="1200" height="658" loading="lazy" decoding="async">

CLI の各 command は目的と副作用が異なります。`doctor` は `anvil` が command として見つかるかを確認するだけで、環境を変更しません。`init` は Playwright config、dApp fixture を使う test、必要なら `package.json` の不足項目を書き込みます。`spec-to-test` は Layer 1 の Markdown 仕様から Vitest の下書きを作ります。`anvil seed` は一時 Anvil と指定 script を起動し、初期化済み chain state を file に保存します。`run --watch` は layer ごとに Vitest child process を起動します。

まず手元の環境だけ確認したいなら `doctor` から始めます。既存プロジェクトに初めて wallet E2E を入れるなら `init` を使います。生成した file をそのまま完成済みの test と見なさず、アプリの URL、locator、期待結果を合わせてから実行してください。仕様から出発したい場合は `spec-to-test` が入力形式を固定しますが、handler、mock、assertion の実装判断は生成後に残ります。

## 影響を理解してから実行する

`init` は生成先に同名 file があると停止します。`--force` を付けたときだけ対象 template を上書きするため、まず version control で差分を見られる状態にしてから実行します。`anvil seed` は local process と state file を作るため、CI では Anvil の導入と state file の保存方針を明示します。`run --watch` は `--dry-run` なら command を表示するだけで、process を起動しません。

`doctor` が成功しても Anvil の version や起動可能性までは検証しません。また `spec-to-test` は仕様全体を自然言語として理解するものではなく、最初の対応 table の `automation` が `yes` の行を基にします。これらの境界を理解すると、CLI は安全な準備作業に集中でき、実際のテスト品質は project の assertion とレビューで維持できます。

## 読み進める

[Quickstart](./quickstart) は既存プロジェクトへ初期化を入れ、差分を確認して最初の E2E を動かす手順です。[使い方](./how-to) は仕様の下書き生成、Anvil state、watch mode の使い分けを説明します。[リファレンス](./reference) は command ごとの option、既定値、停止条件を確認するためのページです。
