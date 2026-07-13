# kiwa test taxonomy — 各 lib 内 test 構成 SSOT

kiwa monorepo 内の全 lib (`packages/*/`) が持つべき test の 5 分類 + dir 構成 + 各 test 契約を SSOT 化する。 本 doc の目的は **「汎用大 tool で domain 精度を落とすのを避け、 各 lib 内に domain-specific test を書く」** 方針を制度化することにある。

## 前提思想

- **汎用 tool は domain 精度に限界がある**。 「速いか」 「メモリ使ってるか」 のような表層指標しか計測できない。
- **domain 判断は各 lib 開発者の頭にある**。 「cache lib は Redis PING 5 ms 以内」 「auth lib は OAuth callback 100 ms 以内」 「agent lib は skill X が tool Y を実際に呼ぶ」 等。
- **共通 primitive は minimal に**。 `perf-harness` = measure / regression / baseline のみ提供、 「何を測るべきか」 の domain 判断は各 lib の test に委ねる。
- **未実装 lib は meta lint で検出**。 test dir 存在チェッカーで PR gate、 実装漏れを構造的に防ぐ。

## dir 構成 (SSOT)

各 lib は以下 5 dir 構成を持つ。 `unit` と `perf` は全 lib 必須、 残り 3 種は該当時のみ。

```
packages/{lib}/tests/
├── unit/            # 関数単位 behavior test (全 lib 必須)
├── perf/            # p95 latency + memory (全 lib 必須)
├── fidelity/        # mock adapter vs real adapter 挙動一致 (mock 提供 lib のみ必須)
├── skill/           # skill 発火 assertion (skill 実装 lib のみ)
└── integration/     # 他 lib 連携 (依存関係ある lib のみ)
```

現状 `packages/*/tests/` 直下に `*.test.ts` が並んでいる pkg は、 `unit/` サブ dir を新設して段階的に移行する。 `perf/` は既に 35 pkg で `tests/perf/` として運用中で、 本 SSOT と整合済。

## test 分類

### unit — 関数単位 behavior test (全 lib 必須)

**目的** = 関数の I/O behavior を検証する。 kiwa の base line、 全 lib で必須。

**契約**。

- file 命名 = `*.test.ts` + `*.defensive.test.ts`
- 実装 primitive = `vitest` の `describe` / `it` / `expect`
- 判定基準 = test-passed marker 4 条件を全て満たすこと (`rules/quality.md § test-passed marker 発行前提` SSOT)
  1. 本 PR diff の behavior test 追加あり
  2. 追加 test が変更箇所を実際に execute する
  3. build success ≠ test 実行、 実行 log 貼付必須
  4. 層 0 (指示項目 check) 記載必須

**example** = `packages/cache/tests/unit/redis-adapter.test.ts` で `cache.get(key)` が期待値返す assertion。

### perf — 速度 + memory (全 lib 必須)

**目的** = hot path の p95 latency + heap delta + concurrent throughput を計測、 baseline 比較で regression 検知。

**契約**。

- file 命名 = `*.perf.ts`
- 実装 primitive = `@kiwa-lab/perf-harness` の `runPerf3Layer()` (SSOT = `packages/perf-harness/README.md`)
- baseline = `.perf-baseline/{lib}.json` に永続化、 `BaselineEnvelope` schema (env metadata 記録)
- report = `docs/quality-reports/perf/saas/{lib}.md` に markdown 出力
- 判定基準 = 各 op が `serialP95CapMs` / `concurrentP95CapMs` / `memoryArrayBuffersCapBytes` を超えたら fail

**example** = `packages/cache/tests/perf/cache.perf.ts` で `redisEnvAccessor` が `serialP95CapMs: 5` 以内を assert。

**注意** = perf test は test 実行時に混ざると `pnpm test` が遅くなる。 将来 `pnpm perf` script 分離を推奨 (現状は同一 script で走る)。

### fidelity — mock ↔ real 挙動一致 (mock 提供 lib のみ必須)

**目的** = kiwa の各 lib が提供する mock adapter が、 real adapter (ioredis / real Redis / real Auth0 等) と同じ挙動を返すかを検証する。 mock を使う downstream test が real 環境で壊れる事故を防ぐ。

**契約**。

- file 命名 = `*.fidelity.test.ts`
- 実装 primitive = `@kiwa-lab/quality-metrics` の fidelity 軸 (現状 `ratio` 計算までは提供、 assertion 用 helper は要追加)
- 対象 = mock adapter を提供する全 lib (auth / cache / queue / search / ai-llm / realtime / storage 等)
- 判定基準 = mock method X 呼出結果と real method X 呼出結果が構造的に一致 (deep equal or schema match)
- real 側は testcontainers / setup*Env で real backend 起動、 CI 環境で回す

**example** = `packages/cache/tests/fidelity/redis-fidelity.test.ts` で `mockRedis.set('k', 'v') → mockRedis.get('k')` と `realRedis.set('k', 'v') → realRedis.get('k')` の結果一致 assert。

**gap** = 現状 kiwa には fidelity 用 primitive helper が薄い。 `@kiwa-lab/quality-metrics` の fidelity 軸 API を拡張して `assertFidelity(mockFn, realFn, cases)` を提供するのが次の課題。

### skill — skill 発火 assertion (skill 実装 lib のみ)

**目的** = skill / agent が想定 tool を **実際に呼んだか** を検証する。 「skill 定義した気でいたが実 code は tool 呼んでない」 型の silent fail を検出する。

**契約**。

- file 命名 = `*.skill.test.ts`
- 実装 primitive = 新規 `@kiwa-lab/skill-test` package (仮、 要新設)。 `assertToolCalled(agent, toolName)` / `assertSkillFlow(agent, expectedFlow)` 提供
- 対象 = skill / agent / tool 発火 logic を実装する lib (agent / mcp / cli / ai-llm 一部)
- 判定基準 = 想定 tool が呼ばれた回数 + 順序 + 引数が仕様通り

**example** = `packages/agent/tests/skill/reply-flow.skill.test.ts` で `agent.reply(input)` が `Read` tool を 1 回呼び、 その後 `Bash` tool を 0 回呼ぶ assertion。

**gap** = 現状 kiwa に skill 発火 assertion 用 primitive なし。 `@kiwa-lab/skill-test` 新設が Q3 課題。

### integration — 他 lib 連携 (依存関係ある lib のみ)

**目的** = 複数 lib を実 import で組合せた end-to-end flow が動くか検証する。 mock 混ぜず real dependency で回す。

**契約**。

- file 命名 = `*.integration.test.ts`
- 実装 primitive = `vitest` + 各 lib の real setup
- 対象 = 他 lib に依存する lib (dapp × cache、 auth × ai-llm、 mcp × agent 等)
- 判定基準 = flow 通しの成功 + 副作用 (DB / cache / queue) の期待状態確認

**example** = `packages/dapp/tests/integration/dapp-cache-flow.integration.test.ts` で `dapp.connect() → cache.get() → dapp.persist()` 通しの動作 assert。

## test 分類別の必須判定

| dir | 対象 lib | 必須判定 |
|---|---|---|
| `unit/` | 全 lib | 全 pkg 必須 |
| `perf/` | 全 lib | 全 pkg 必須 |
| `fidelity/` | mock 提供 lib | mock adapter 実装 lib のみ必須 |
| `skill/` | skill 実装 lib | agent / mcp / cli / skill 定義 lib のみ必須 |
| `integration/` | 他 lib 依存 lib | 依存関係のある lib のみ必須 |

## meta lint (Q1、 本 SSOT 準拠でチェック)

Q0 (本 SSOT) 準拠後、 meta lint tool を新設して以下を PR gate で強制する。

- 各 lib に `unit/` + `perf/` が存在するか
- mock adapter 提供 lib に `fidelity/` が存在するか
- skill 実装 lib に `skill/` が存在するか
- 依存関係ある lib に `integration/` が存在するか

不在なら PR block、 lib 開発者に強制する。 実装は `tests/release-smoke/tests/test-taxonomy-existence.test.ts` (存在 chk) + `scripts/kiwa-taxonomy-run.mjs` (実行 chk CLI、 Q5) の 2 経路。

## 分類別実行 chk CLI (Q5)

meta lint (存在 chk) は 「file がある」 かのみ判定、 「file の中身が実行して pass するか」 は関与しない。 このため file 存在 = OK でも中身 broken の silent fail が起き得る。

Q5 = `scripts/kiwa-taxonomy-run.mjs` = 分類 (perf / fidelity / skill / integration) を指定して該当 lib 横断で vitest を実行 + lib × category の pass / fail matrix を出力する CLI。 meta lint (存在) + Q5 CLI (実行) の 2 軸で test-taxonomy meta 経路が完成する。

用法。

```
pnpm test:taxonomy -- --category fidelity
pnpm test:taxonomy -- --category skill --lib agent
pnpm test:taxonomy -- --category integration --format json
pnpm test:taxonomy -- --category fidelity --include-real   # Q6-5 real driver test 含む (KIWA_MODE=real auto)
pnpm test:taxonomy:all                                       # 4 分類 (perf/fidelity/skill/integration) 一括実行 + 統合 matrix
```

- `--category` = perf / fidelity / skill / integration / all のいずれか (必須)
  - `all` = 4 分類全実行 + 統合 matrix 出力、 1 分類でも fail で exit 1
- `--lib` = 単一 lib 指定 (省略 = config 記載の該当 lib 全走査)
- `--format` = table (default) or json
- `--include-real` = `*.real.<category>.test.ts` (real driver test) を実行対象に含める、 KIWA_MODE=real env auto 注入 (Q6-5)
- exit code = 0 (全 pass) / 1 (1 件でも fail / compile-fail / parse-fail / no-files / no-tests)
- **no-files も fail 判定** = CLI の目的は「揃ってる + 実行 pass」 の完全 chk、 file 不在で pass 扱いは意味を持たない。 config 記載 lib で該当分類 file 0 件 = 必ず exit 1 (flag なし)
- **perf 分類特殊経路** = perf は独自 config (`vitest.perf.config.ts`) 使用、 tsc compile 対象外 (`tests/perf/**/*` は `tsconfig.vitest.json` の exclude)、 CLI 側で `runPerfCell` に分岐して `vitest run -c vitest.perf.config.ts` 経路で実行する

**real driver test SSOT** (Q6)。 各 lib の `tests/fidelity/*.real.fidelity.test.ts` は mock adapter が real backend (testcontainers Redis / real Postgres / real BullMQ 等) 挙動を再現しているか動的検証する経路。 `resolveRealFidelityMode` primitive (`@kiwa-lab/quality-metrics`) で env-gate、 KIWA_MODE=real + 必須 env keys 全 set 時のみ実行、 default (未設定 or mock) は skip する opt-in 契約。 CLI 側 `--include-real` は Q6 exemplar (cache / queue / orm) を含めた matrix 実行の統一経路。

domain-specific test 中身の質 (case 網羅 / edge / coverage) は各 lib 開発者の責務、 meta lint + Q5 CLI の役割は 「test が正しく組立てられ実行して通っているか」 の構造的 gate に特化する (前提思想 = 汎用 tool で domain 精度は落ちるため domain 判断は各 lib に置く)。

## 現状 gap (2026-07-13 時点)

| dir | 現状 | gap |
|---|---|---|
| `unit/` | 全 pkg 完備 (直接 `tests/*.test.ts` として) | dir 分離は段階的、 現状の flat 構造は許容 |
| `perf/` | 35 pkg 完備 (`tests/perf/*.perf.ts`) | dir 名は既存整合、 gap なし |
| `fidelity/` | primitive 未整備 | `@kiwa-lab/quality-metrics` 拡張 + 各 lib 実装が必要 |
| `skill/` | 皆無 | `@kiwa-lab/skill-test` 新設 + skill 実装 lib への test 追加が必要 |
| `integration/` | 一部 (dapp / e2e) 存在、 命名バラバラ | 命名統一 + 未実装 lib への追加が必要 |

## 進行順序

- **Q0 (完了予定 = 本 doc)** = test taxonomy SSOT 確定
- **Q1** = meta lint tool 新設 (`packages/test-existence-lint/`)、 Q0 準拠で dir 存在チェック
- **Q2** = 各 lib で不足 test dir を Q0 契約に沿って追加 (fidelity 系優先、 skill 系次)
- **Q3** = `packages/perf-harness/` を primitive のみに縮小 (three-layer / live / gate を各 lib 側の test に移す)
- **Q4** = `@kiwa-lab/skill-test` 新設 = skill 発火 assertion primitive

各 Q は独立 PR。 Q1 は Q0 に依存、 Q2 は Q0 + fidelity primitive 拡張に依存、 Q3 は Q2 完遂後、 Q4 は Q0 完遂後。

## 参照

- `rules/quality.md § test-passed marker 発行前提` = unit test の 4 条件 SSOT
- `packages/perf-harness/README.md` = perf test primitive の SSOT (精度契約 5 軸)
- `packages/quality-metrics/README.md` = fidelity / coverage / release gate SSOT
