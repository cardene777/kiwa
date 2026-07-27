# CLI の導入

このガイドでは、既存プロジェクトに dApp E2E の雛形を追加し、生成物を確認します。`init` はファイルを書き換えるため、まず version control で差分を確認できる状態にしてください。

## 初期化する

プロジェクト root で実行します。

```bash
pnpm dlx @kiwa-lab/cli init
```

既定では `e2e/connect.spec.ts` と `playwright.config.ts` を作り、`tsconfig.json` がない場合だけ雛形も作成します。`package.json` がある場合は `test:e2e` script、`@kiwa-lab/dapp`、`@playwright/test`、`viem` の不足分を追加します。既存の dependency や script の値は置き換えません。command が成功したら、生成した file と `package.json` の変更を version control の差分で確認してください。

## 生成先を変える

テストを `tests/e2e` に置き、専用 config を使う場合は次のように指定します。

```bash
pnpm dlx @kiwa-lab/cli init \
  --testDir tests/e2e \
  --config-suffix dapp \
  --script-key test:dapp
```

この例では `tests/e2e/connect.spec.ts` と `playwright.dapp.config.ts` を作ります。`--testDir` は project 内の相対 path だけを受け付けます。絶対 path や `..` を含む値は失敗します。

## 競合を確認する

同名ファイルがすでにあると `init` は `InitConflictError` で停止します。内容を確認せずに `--force` を付けると、生成対象のテンプレートが上書きされます。

```bash
pnpm dlx @kiwa-lab/cli init --force
```

生成後に依存関係を install し、差分をレビューしてからテストを実行します。アプリを起動する command と URL は生成された `playwright.config.ts` で自分の project に合わせます。ここを直さないまま `page.goto` が失敗しても、fixture の失敗ではありません。

```bash
pnpm install
pnpm exec playwright test
```

成功時は Playwright が生成された `connect.spec.ts` を実行し、`passed` を表示します。`anvil` が見つからないときは、先に `pnpm dlx @kiwa-lab/cli doctor` を実行します。既存 file で停止した場合は、生成物を比較して統合するか、意図して上書きすると決めたときだけ `--force` を使います。

## 次に読む

[使い方](./how-to) で仕様生成と Anvil state を扱います。[リファレンス](./reference) には各コマンドの副作用をまとめています。
<!-- skill-guide -->
## skill で test を設計する

CLI の `init` は既存 project に手書きの dApp E2E 雛形を追加する command です。仕様から test case を設計する作業は `kiwa-play` skill の担当です。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入した場合は、次の順序で実行します。

初回は plugin を導入して再読込します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer e2e --module wallet-connect --input app/
/kiwa:kiwa-play --mode new
```

skill が生成する Playwright test と、CLI が作る `connect.spec.ts` はどちらも `@kiwa-lab/dapp` を runtime に使います。先に `init` で project の config と依存関係を揃えるか、既存の Playwright 設定に生成した test を合わせるかを選び、二つの雛形を同じ path に重ねて書かないでください。

出力先を変更していなければ、生成された Playwright file だけを実行します。

```bash
pnpm exec playwright test e2e/connect.spec.ts
```
