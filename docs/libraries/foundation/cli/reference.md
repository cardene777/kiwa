# CLI リファレンス

実行コマンドは `kiwa` です。Node.js 20 以降が必要です。

## init

```bash
kiwa init [--force] [--testDir path] [--config-suffix name] [--script-key key] [--with-deploy foundry-path]
```

Playwright config と `connect.spec.ts` を作ります。`package.json` がある場合は不足している script と devDependencies だけを追加します。既存の生成先があると停止し、`--force` を指定した場合だけ上書きします。

| option | 内容 |
| --- | --- |
| `--force` | 競合した生成ファイルを上書きする |
| `--testDir` | project 内の相対 test directory を指定する |
| `--config-suffix` | `playwright.name.config.ts` を作る |
| `--script-key` | 生成する package script 名を指定する |
| `--with-deploy` | Foundry project への相対 path を埋めた setup と fixture を追加する |

`--testDir` は絶対 path と `..` を拒否します。`--config-suffix` は英数字、`_`、`-` だけを受け付けます。既存の `tsconfig.json` に `strict: false` があっても変更せず warning を返します。

## doctor

```bash
kiwa doctor
```

`which anvil` の結果を表示します。Anvil がない場合は終了 code 1 で、Foundry の install 方法を stderr に表示します。バージョン確認、ネットワーク接続、Anvil の起動は行いません。

## anvil seed

```bash
kiwa anvil seed script.mjs --out state.json [--chain-id 31337] [--port number]
```

fresh Anvil を起動し、script を Node.js で実行して state を出力します。`--out` は必須です。script と出力先は current working directory を基準に解決され、出力先の親 directory は作成されます。既定 chain ID は 31337、port は空き port です。

script は `ANVIL_RPC_URL` と `ANVIL_PORT` を受け取ります。起動待ちの上限は 10 秒です。script の失敗や出力 file の欠落はコマンド失敗になります。

## spec-to-test

```bash
kiwa spec-to-test --in spec.md --out spec.test.ts [--layer api]
```

`--in` と `--out` は必須です。仕様の meta と最初の table を解析し、`api`、`ui`、`data`、`cli` の layer に対応した Vitest 雛形を出力します。認識できない table、`automation: yes` の行がない仕様では、空または最小の test file が出力されることがあります。生成結果を完成済みテストとして扱わず、必ず assertion と dependency を補ってください。

## run watch

```bash
kiwa run --watch [--layer unit] [--dry-run]
```

`--layer` は繰り返して指定できます。`--dry-run` は起動する Vitest command を表示するだけで child process を作りません。省略時の layer は `unit`、`api`、`ui` です。

JavaScript から同じ計画を扱う場合は `runInit`、`runSpecToTest`、`runAnvilSeed`、`planRunWatch`、`runWatch` を import できます。`runWatch` は `dryRun: true` なら plan だけを返し、それ以外では child process を返します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| &#96;anvil seed: script exited with code $&#123;exitCode&#125;&#96; | [packages/cli/src/commands/anvil-seed.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/anvil-seed.ts#L125) |
| &#96;anvil seed: dump-state file was not produced at $&#123;outPath&#125;&#96; | [packages/cli/src/commands/anvil-seed.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/anvil-seed.ts#L128) |
| &#96;anvil seed: failed to start on port $&#123;port&#125; within $&#123;timeoutMs&#125;ms&#96; | [packages/cli/src/commands/anvil-seed.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/anvil-seed.ts#L42) |
| &#96;anvil seed: script not found: $&#123;scriptPath&#125;&#96; | [packages/cli/src/commands/anvil-seed.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/anvil-seed.ts#L68) |
| &#96;kiwa init: --testDir must be a relative path inside the project, got "$&#123;value&#125;"&#96; | [packages/cli/src/commands/init.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/init.ts#L200) |
| &#96;kiwa init: --config-suffix must match &#91;a-zA-Z0-9&#95;-&#93;+, got "$&#123;suffix&#125;"&#96; | [packages/cli/src/commands/init.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/init.ts#L212) |
| 'kiwa init: --with-deploy requires a foundry project path' | [packages/cli/src/commands/init.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/init.ts#L236) |
| &#96;kiwa init: --with-deploy must be a relative path, got absolute "$&#123;value&#125;"&#96; | [packages/cli/src/commands/init.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/init.ts#L240) |
| &#96;Template not found: $&#123;source&#125;&#96; | [packages/cli/src/commands/init.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/init.ts#L305) |
| 'kiwa run --watch: at least one layer is required (use --layer L)' | [packages/cli/src/commands/run-watch.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/run-watch.ts#L46) |
| &#96;kiwa run --watch: unknown layer "$&#123;layer&#125;"&#96; | [packages/cli/src/commands/run-watch.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/run-watch.ts#L50) |
| &#96;kiwa run --watch: no package.json found at $&#123;opts.cwd&#125;&#96; | [packages/cli/src/commands/run-watch.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/run-watch.ts#L54) |
| &#96;spec-to-test: input not found: $&#123;inPath&#125;&#96; | [packages/cli/src/commands/spec-to-test.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/spec-to-test.ts#L307) |
| &#96;spec-to-test: unsupported layer "$&#123;layer&#125;". Supported: api, ui, data, cli.&#96; | [packages/cli/src/commands/spec-to-test.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/commands/spec-to-test.ts#L319) |
| 'not found' | [packages/cli/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/index.ts#L163) |
| &#96;kiwa init: $&#123;flag&#125; requires a value&#96; | [packages/cli/src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/index.ts#L48) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。




<!-- kiwa-public-api:end -->
