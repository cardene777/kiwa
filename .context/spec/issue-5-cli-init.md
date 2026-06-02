# spec: issue-5-cli-init

## タスクサマリ

dapp-e2e CLI に `init` subcommand を追加し、外部 dApp プロジェクトに fixture import 済 e2e spec + playwright.config + package.json script を生成する scaffold 機能を実装する。
`pnpm dlx @dapp-e2e/cli init` で外部プロジェクトで動作することが roadmap AC 6 (v0.1.0 publish 動作確認) の前提となる。
既存の `dapp-e2e doctor` (PR #2) を破壊せず、CLI runtime に viem 以外の dep を追加しない (zero runtime dep 方針)。

## 受入条件 (AC)

- AC 1: CLI subcommand dispatch — `dapp-e2e init` / `dapp-e2e doctor` / `dapp-e2e --help` / `dapp-e2e` (unknown) の 4 経路を `packages/cli/src/index.ts` で正しく分岐し、既存 `doctor` の動作 (`OK anvil at ...` exit 0 / `ERR anvil not found` exit 1) を破壊しない
- AC 2: `dapp-e2e init` 実行で cwd に `e2e/connect.spec.ts` + `playwright.config.ts` を新規作成し、`import { dappE2eTest as test } from '@dapp-e2e/core'` 済の TypeScript fixture テンプレが配置される (template 内 viem 連携あり、anvil 起動から sign / sendTransaction まで通る最小例)
- AC 3: `dapp-e2e init` 実行で cwd の `package.json` に `scripts.test:e2e: "playwright test"` を追加 (既存 scripts は保持)、`devDependencies` に `@dapp-e2e/core` (`workspace:* or ^0.1.0`) `@playwright/test` (`^1.49.0`) `viem` (`^2`) の 3 つを追加。host で `pnpm install` 任せ (CLI 内では install を実行しない)
- AC 4: 既存 file 上書き保護 — cwd に `e2e/connect.spec.ts` / `playwright.config.ts` のいずれかが既に存在する場合、`--force` flag なしでは上書きせず exit code 1 + stderr で衝突 file 列挙、`--force` 指定で上書き。`package.json` は merge 編集 (既存 scripts/devDeps を保持しつつ追加)
- AC 5: template 解決経路 — bundled `dist/templates/*.tpl` を `new URL('../templates/*.tpl', import.meta.url)` + `fs.readFileSync` で解決し、`pnpm dlx @dapp-e2e/cli init` 経由でも cwd 関係なく正しく動作。vitest で 1 ケース検証 (temp dir で init 実行 → 生成 file 内容 assert + 既存衝突 → `--force` 上書き)

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| CLI subcommand | `init` 新規 + 既存 `doctor` の dispatch 整備 + `--help` text |
| template 種類 | `e2e/connect.spec.ts` + `playwright.config.ts` の 2 file 固定 |
| package.json 編集 | `scripts.test:e2e` 追加 + `devDependencies` 3 件追加のみ (JSON merge) |
| flag | `--force` のみ (上書き許可) |
| CLI runtime dep | zero dep 維持 (node 標準 `fs` / `path` / `node:url` のみ) |
| 上書き保護 | 衝突検出 + `--force` 上書き、`package.json` は merge 編集 |
| template 内容 | 単一 wallet 名乗り (basic-connect 相当)、anvil + sign + sendTransaction の最小 e2e flow |
| エラー UX | stderr に file path + 1 文の解決方法 (例 「e2e/connect.spec.ts already exists. Use --force to overwrite.」) |
| build 設定 | tsup で `.tpl` も dist に含める (静的 asset コピー or import 戦略) |

### out (本 Issue で対応しない)

| 観点 | out |
|---|---|
| `record` / `run` subcommand | roadmap 反例 3 違反、Playwright codegen で代替 |
| 複数 template 切替 | `init --template multi-wallet` 等、将来別 Issue |
| `--yes` / `--interactive` / 質問プロンプト | 単純化のため init は引数なしで即実行、prompt なし |
| `tsconfig.json` 生成 / `.gitignore` 更新 | host プロジェクトの既存設定を尊重、CLI は touch しない |
| `pnpm install` / `npm install` 自動実行 | host のパッケージマネージャは検出困難、scripts/devDeps 追記のみで host 任せ |
| カラー出力 / spinner / progress bar | zero dep 方針 (kleur / chalk / picocolors 追加しない) |
| EIP-6963 multi-wallet template | Issue #7 (v0.2 目玉) で対応 |
| backup 作成 / 3-way merge | 上書き保護は `--force` のみで衝突検出のみ |

## 反例ケース (動かないはず・対象外)

- 反例 1: `record` / `run` subcommand を追加する PR は roadmap 反例 3 違反 (Playwright codegen + `pnpm exec playwright test` で代替)
- 反例 2: `packages/cli/package.json` の `dependencies` field に runtime dep (yargs / commander / kleur / chalk 等) を追加する PR は CLI zero runtime dep 方針違反、reject。node 標準 `fs` / `path` / `node:url` のみで実装
- 反例 3: `dapp-e2e init` 内で `pnpm install` / `npm install` を自動実行する PR は副作用過大、reject (host の package manager 検出困難、scripts/devDeps 追記のみで host install 任せ)
- 反例 4: 既存 file (`e2e/connect.spec.ts` / `playwright.config.ts`) を `--force` なしで上書きする PR は AC 4 違反、reject。`package.json` も既存 key を破壊する merge は禁止 (新規 key 追加のみ)
- 反例 5: template `.tpl` 内に `record` / `run` 等の未実装 CLI subcommand への言及や `pnpm exec dapp-e2e run` 等の指示を含む PR は反例 1 と整合矛盾、reject (template は `pnpm exec playwright test` を案内)

## 影響範囲 (touched file 候補)

新規 4 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/src/commands/init.ts` — init コマンド本体 (template 解決 + file 書き出し + 上書き保護 + package.json merge 編集)
- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/src/templates/connect.spec.ts.tpl` — `import { dappE2eTest as test } from '@dapp-e2e/core'` 済の e2e spec template (anvil + sign + sendTransaction の最小例)
- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/src/templates/playwright.config.ts.tpl` — `defineConfig({ testDir: './e2e', timeout: 30_000, fullyParallel: false, use: { headless: true } })` 相当
- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/tests/init.test.ts` — vitest テスト (temp dir で init → 生成 file 検証 / 衝突 → --force / package.json merge)

修正 1 file:

- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/src/index.ts` — argv dispatch 追加 (`init` 経路 + `--help` text + unknown handling)

設定変更 (実装で必要なら):

- `/Users/cardene/Desktop/projects/dapp-e2e/packages/cli/package.json` — tsup config 追加 (`--loader .tpl=text` or `files: ["dist"]` の include 確認)、必要なら scripts 微調整

合計 5-6 file (新規 4 + 修正 1 + 暫定 1)。

## 既知のリスク・前提

### 前提

- 既存 `doctor` 実装は `packages/cli/src/index.ts` 22 行に集約、`execSync('which anvil')` 経路で動作
- core export (`packages/core/src/index.ts`) は `dappE2eTest` を含む 7 export 済 (PR #2)
- examples/basic-connect が template の参考実装 (`tests/connect.spec.ts` 270 行 + `playwright.config.ts` 15 行)、これを最小化して 2 file template に落とし込む
- Issue #4 で確立した `.npmignore` + `files: ["dist"]` で `src/templates/*.tpl` が tarball に含まれるかを build/pack で確認 (tsup が `.tpl` を `dist/` に複写する設定必要)
- CLI bin は `dist/index.js` を node から直接実行、template 解決は `new URL('../templates/*.tpl', import.meta.url)` で `dist/templates/*.tpl` を参照

### リスク

- リスク 1: **tsup が `.tpl` を bundle しない** — デフォルト tsup は `.ts` のみ。tsup config で `loader: { '.tpl': 'text' }` を指定 (esbuild loader 経由で string import) する案、または `tsup --onSuccess "cp -r src/templates dist/templates"` で copy する案、どちらかを選択する必要あり。実装段階で AskUserQuestion 検討
- リスク 2: **template 内の `@dapp-e2e/core` import** — devDeps 3 件追加 (core + playwright + viem) の version range が peerDeps と integers でない可能性 (例 core が `workspace:*` で publish 後は `^0.1.0` に変わる)。template 内は `^0.1.0` 固定で安全、publish 時の version bump は別 Issue で対応
- リスク 3: **`pnpm dlx` 経路の cwd 解決** — `pnpm dlx @dapp-e2e/cli init` は temp dir に install して bin 実行、`process.cwd()` は呼び出し元 cwd を維持するが、template 解決の `import.meta.url` は temp dir 内 dist を指す。vitest テストで 1 ケース検証
- リスク 4: **package.json merge の JSON 整形** — 既存 package.json のインデント (2 space / tab) を保持するため、`JSON.stringify(obj, null, 2)` 固定だと既存 4 space project で整形崩れる。`detect-indent` 風の自前検出 (1 line 目の最初の `"` の前の空白数で判定) を node 標準のみで実装
- リスク 5: **既存 `doctor` の dispatch 破壊** — `index.ts` 修正で `process.argv[2]` 分岐を関数化 (`switch (cmd)` or `if/else`) する際、`doctor` の既存テスト (なければ追加) と stdout/stderr 一致を保つ

### 粒度判定

- AC 数: 5 (緑閾値 3-5、ぎりぎり緑)
- 変更 file 数: 5-6 (緑閾値 5 以下、ぎりぎり緑〜黄)
- 推定実装時間: 50 分 (AC 5 件 × 10 分、黄閾値 30-60、黄)
- **判定: 緑〜黄の境界 (緑寄りで単発進行)**、ユーザー確認済 — CLI dispatch / template 解決 / file 生成 / 上書き保護 / package.json 編集は有機的に結合しており分割すると PR 間依存が重くなる

## 次ステップ

1. 本 spec を入力に `/issue-plan` で Issue #5 起票 (spec fast path)
2. feature branch `feature/5-cli-init` 作成済 (本 spec 保存と同 branch)
3. `/tdd` で init.ts + index.ts の RED テスト作成 (init.test.ts に 4-6 ケース)
4. `/impl` → `/parallel-review` → `/verify` → PR (Closes #5)
