# CLI の使い方

`spec-to-test`、`anvil seed`、`run --watch` は目的が異なります。最初は仕様を解析して test の下書きを作り、chain state が必要なときだけ Anvil を起動し、日常の編集時だけ watch mode を起動します。いずれも生成物や起動対象を確認してから次へ進みます。

## 仕様からテストの雛形を作る

`spec-to-test` は Markdown の meta と最初の table から test file を作ります。`module` と `layer` を meta に置き、table には少なくとも `id`、`given`、`when`、`then`、`automation`、`mode` を含めます。

```md
- module: profile
- layer: api

| id | observation | given | when | then | automation | mode | route |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-PROFILE-001 | profile can be read | a user exists | GET /profile | returns 200 | yes | live | /profile |
```

```bash
pnpm dlx @kiwa-lab/cli spec-to-test \
  --in tests/profile.spec.md \
  --out tests/profile.spec.test.ts \
  --layer api
```

`--layer` を指定すると仕様 meta より優先します。生成器は `automation: yes` の行だけを対象にし、API layer では route と HTTP method を雛形へ反映します。handler、mock、実際の assertion は `TODO` の箇所をプロジェクトの実装に合わせて補います。

生成された file だけを実行します。

```bash
pnpm exec vitest run tests/profile.spec.test.ts
```

## Anvil state を作る

`anvil seed` は fresh Anvil を起動し、script を Node.js で実行してから `--dump-state` の出力を確認します。

```bash
pnpm dlx @kiwa-lab/cli anvil seed scripts/seed-chain.mjs \
  --out .kiwa/anvil-state.json \
  --chain-id 31337
```

script には `ANVIL_RPC_URL` と `ANVIL_PORT` が渡されます。`--port` を省略すると空き port を選びます。script が非ゼロで終了した場合、または state file が生成されなかった場合はコマンドが失敗します。

このコマンドはローカル process を起動し state file を書き込みます。CI では Anvil を事前に install し、state file の保存先を artifact または管理対象として明示してください。

## layer ごとの watch を開始する

```bash
pnpm dlx @kiwa-lab/cli run --watch --layer unit --layer api
```

各 layer は対応する directory を `pnpm exec vitest --watch --dir` に渡します。指定できる layer は `unit`、`api`、`ui`、`data`、`cli`、`e2e` です。layer を省略すると `unit`、`api`、`ui` を使います。

まず child process を起動せず確認したい場合は `--dry-run` を付けます。

```bash
pnpm dlx @kiwa-lab/cli run --watch --layer api --dry-run
```

`run` は現在の directory に `package.json` がない場合、未知の layer を指定した場合、または `--watch` を省略した場合に失敗します。
