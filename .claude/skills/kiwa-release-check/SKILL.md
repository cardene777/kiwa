---
name: kiwa-release-check
description: |
  kiwa の release レベル判定を 6 gate + release-smoke で一括 check する project-local skill。
  Gate 1 (coverage) / Gate 2 (mutation MSI、 opt-in) / Gate 3 (taxonomy CLI) / release-smoke /
  build-check / Gate 5 (dogfood 実施状態) を統合実行して kiwa が release 可能な状態か判定、
  全 gate pass で「✅ RELEASE READY」 と判定する。
  内部で `scripts/release-readiness-check.mjs` を呼出、 test check tool (test:cov / taxonomy CLI /
  release-smoke / mutation / dogfood 117 project structural chk) をすべて含めて read する。
  release chain 前の quick check、 CI 全面禁止規約 (rules/git-workflow.md) に沿って local 実行専用。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep
---

# /kiwa-release-check — kiwa release レベル 6 gate 一括判定 skill

user 要求 「リリースできるレベルをチェックするもの + 性能担保は各 lib で dogfood app 経由で
verify」 に対応する project-local skill。 6 gate (coverage / mutation / taxonomy / release-smoke /
build / dogfood) を統合実行して kiwa が release 可能な状態か判定する。

## trigger

- `/kiwa-release-check` 明示起動
- 「release チェック」 「リリースレベル確認」 「4 gate 実行」 「release readiness」 等の自然文
- `pnpm release` 前の quick verify
- 主要 lib 変更後の release レベル confirmation

## 実行 flow

### Step 1 — release-readiness-check tool 起動

```bash
node scripts/release-readiness-check.mjs
```

内部で以下 6 gate を順次実行、 各 gate の pass/fail を判定。

- **Gate 1 = coverage** (`scripts/check-coverage-gates.mjs`)
  - **固定閾値** = Lines/Statements ≥ 90% + Functions ≥ 90% + Branches ≥ 80%
  - **高水位** = `coverage-high-water.json` に記録した最高値を下回っても fail (#2177)
  - 2 つは AND で、どちらか一方でも割れば fail。 固定閾値は新規 lib の下限、
    高水位は「一度到達した範囲が静かに剥がれないこと」 を守る
  - 実測が高水位を上回った時の更新は `node scripts/check-coverage-gates.mjs --update-high-water`。
    **gate の実行では更新しない** = 下がった値を baseline に焼き付けないため
  - 更新は上げる方向にしか効かない。 意図的に下げる (code を消した等) 場合は file を手で直す
  - 記録の無い lib は固定閾値だけで判定し、report に `(高水位なし)` と出る。
    **記録の欠落は release-smoke の `coverage-high-water-completeness` が別途 fail させる** =
    gate 側を fail-open にしたまま、欠けた状態が既定として固定されるのを防ぐ
  - 記録 file が壊れている (JSON として読めない / object でない / 値が数値でない) 場合は
    exit 2 で落ちる。 file が **無い** 場合だけ「記録なし」 に倒す = 前者は誰かが壊した状態で、
    coverage の劣化と同じく人が見るべき事象のため
  - 全 kiwa lib で verify、 未達 lib は fail 報告。 fail の理由は
    「閾値を割った」 と「下がった (高水位 N%)」 を書き分ける
- **Gate 2 = mutation MSI** (`scripts/check-mutation-gates.mjs`)
  - test の kill/survive ratio = test 品質軸、 tier 別 threshold (Core 80 / Framework 70 / SaaS 65 / Test-type 60)
  - v2 (2026-07-14) = default 実行に格上げ (事前生成済 mutation.json を read する軽量 gate、 数秒)
  - stryker run 自体は nightly cron / `pnpm -F <pkg> run test:mutation` で事前生成、 本 gate は read + 閾値判定のみ
  - `--skip-mutation` or `--skip=gate2-mutation` で skip 可能
- **Gate 3 = taxonomy CLI** (`scripts/kiwa-taxonomy-run.mjs --category all`)
  - perf / fidelity / skill / integration 4 category × 全 lib
  - 中身 chk 3 軸 (missing-assertion / trivial-assertion / minCases) 通過必須
- **release-smoke** (`tests/release-smoke/`)
  - publish invariant / import surface / license consistency 等 379 test
- **build-check** (`pnpm -r --if-present run typecheck`)
  - TypeScript compile pass 全 lib
- **Gate 5 = dogfood 実施状態** (`scripts/check-dogfood-gate.mjs`)
  - kiwa 設計思想 = 「各 lib の性能担保は複数 dogfood application で lib を実 use して verify」
  - 117 dogfood-* project × 3 条件 = tests/perf/ dir 存在 + scripts.test:perf 存在 + @kiwa-lab/* dependency 有
  - structural chk default = 各 dogfood project の実装状態確認 (fast)
  - `--include-dogfood-run` flag or env `INCLUDE_DOGFOOD_RUN=1` で opt-in = 各 dogfood project の test:perf 実行 (heavy、 数十分)
- **Gate 6 = app-scenario perf** (`scripts/check-app-scenario-gate.mjs`、 2026-07-14 新設)
  - 各 lib の `tests/perf/{lib}-app-scenario.perf.{ts,tsx}` 存在 + 中身 3 op 構成 chk
  - structural chk default = file 存在 + main API import + runPerf3Layer + op 数 3+ を regex chk (数秒)
  - `--include-app-scenario-run` flag で opt-in = 各 lib の `pnpm test:perf` 実行 (heavy、 20-30 min)
  - test 追加後の壊れ検知を release check に組込む gate (2026-07-14 の 36 lib 完遂後の資産保護)

### Step 2 — 結果集約 + 判定

- 全 gate pass = **✅ RELEASE READY** (exit 0)
- 1 gate 以上 fail = **❌ RELEASE BLOCKED** (exit 1)、 failed gates を列挙報告
- gate script/tool missing = **⚠️ MISSING GATES** (exit 1)

### Step 3 — 詳細 log の read + user 報告

- 各 gate 実行 log は summary-only mode で pipe 保持
- fail 時は failed gate の stderr/stdout を user に提示
- pass 時は「全 gate pass、 kiwa は release 可能な状態」 report

## 引数仕様

skill 起動時に user が付けられる option。

- `--skip=<gate-name>[,<gate-name>...]` = 特定 gate skip (release-smoke / build-check / gate3-taxonomy 等)
- `--skip-mutation` = gate2-mutation を skip (mutation.json 未生成状態でも RELEASE READY 判定を許容する場合)
- `--summary-only` = 詳細 log 抑制、 summary table のみ表示
- `--include-dogfood-run` = gate5 の実 dogfood test:perf run を有効化 (heavy、 数十分)
- `--include-app-scenario-run` = gate6 の各 lib `pnpm test:perf` 実行を有効化 (heavy、 20-30 min)
- 引数なし = 全 6 gate 実行 (default = light 経路、 数分完了、 推奨)

## 使用例

```bash
# 全 gate 実行 (完全 release レベル判定、 数分)
/kiwa-release-check

# quick verify (Gate 1 + dogfood structural のみ、 秒単位)
/kiwa-release-check --skip=gate3-taxonomy,release-smoke,build-check

# mutation skip (mutation.json 未生成環境用、 default では実行される)
/kiwa-release-check --skip-mutation

# dogfood 全 project test:perf も実行 (数十分)
/kiwa-release-check --include-dogfood-run

# app-scenario perf 実 run も実行 (20-30 min)
/kiwa-release-check --include-app-scenario-run

# 完全 release レベル (dogfood run + app-scenario run 両方、 heavy 完全確認)
/kiwa-release-check --include-dogfood-run --include-app-scenario-run
```

## 完了条件

- release-readiness-check tool 実行完了
- 全 gate の pass/fail 判定完了
- Gate 1 が高水位を下回った lib を報告した場合、**下げてよいかを判断してから**進む
  (code を消したなら `coverage-high-water.json` を手で直す、そうでなければ test を戻す)
- summary table + release-ready / release-blocked 判定を user に報告
- exit code = 0 (all pass) or 1 (any fail)

## 関連 file

- `scripts/release-readiness-check.mjs` = 6 gate 統合 runner (本 skill 経由で呼出)
- `scripts/check-coverage-gates.mjs` = Gate 1 coverage check
- `scripts/check-mutation-gates.mjs` = Gate 2 mutation MSI (v2 = default 有効、 事前生成 JSON read)
- `scripts/kiwa-taxonomy-run.mjs` = Gate 3 taxonomy CLI
- `scripts/check-dogfood-gate.mjs` = Gate 5 dogfood structural / --run で real behavior
- `scripts/check-app-scenario-gate.mjs` = Gate 6 app-scenario perf test 存在 + 実行 (2026-07-14 新設)
- `tests/release-smoke/` = release-smoke test 群 (379 test)
- `package.json prerelease` script = `pnpm release` 実行時に自動発火する経路
- `package.json release-check` script = 明示 quick check alias

## 免責事項

- **CI 全面禁止** (rules/git-workflow.md) に沿って local 実行専用、 GitHub Actions 等 CI 経路は使わない
- release-smoke の Playwright 依存 test は browser install 済前提、 未 install なら skip 推奨
