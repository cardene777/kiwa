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

内部で以下 4 gate を順次実行、 各 gate の pass/fail を判定。

- **Gate 1 = coverage** (`scripts/check-coverage-gates.mjs`)
  - Lines/Statements ≥ 90% + Functions ≥ 90% + Branches ≥ 80%
  - 全 kiwa lib で verify、 未達 lib は fail 報告
- **Gate 2 = mutation MSI** (`scripts/check-mutation-gates.mjs`、 env `INCLUDE_MUTATION=1` で opt-in)
  - test の kill/survive ratio = test 品質軸
  - default skip (30+ min heavy)、 明示 opt-in 時のみ実行
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
  - env `INCLUDE_DOGFOOD_RUN=1` で opt-in = 各 dogfood project の test:perf 実行 (heavy、 数十分)

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
- `--summary-only` = 詳細 log 抑制、 summary table のみ表示
- 引数なし = 全 gate 実行 (推奨、 完全 release レベル判定)

## 使用例

```bash
# 全 gate 実行 (完全 release レベル判定、 数分)
/kiwa-release-check

# quick verify (Gate 1 + dogfood structural のみ、 秒単位)
/kiwa-release-check --skip=gate3-taxonomy,release-smoke,build-check

# mutation 含む完全 verify (30+ min)
INCLUDE_MUTATION=1 /kiwa-release-check

# dogfood 全 project test:perf も実行 (数十分)
INCLUDE_DOGFOOD_RUN=1 /kiwa-release-check

# 完全 release レベル (mutation + dogfood run 両方)
INCLUDE_MUTATION=1 INCLUDE_DOGFOOD_RUN=1 /kiwa-release-check
```

## 完了条件

- release-readiness-check tool 実行完了
- 全 gate の pass/fail 判定完了
- summary table + release-ready / release-blocked 判定を user に報告
- exit code = 0 (all pass) or 1 (any fail)

## 関連 file

- `scripts/release-readiness-check.mjs` = 4 gate 統合 runner (本 skill 経由で呼出)
- `scripts/check-coverage-gates.mjs` = Gate 1 coverage check
- `scripts/kiwa-taxonomy-run.mjs` = Gate 3 taxonomy CLI
- `tests/release-smoke/` = release-smoke test 群 (379 test)
- `package.json prerelease` script = `pnpm release` 実行時に自動発火する経路
- `package.json release-check` script = 明示 quick check alias

## 免責事項

- **CI 全面禁止** (rules/git-workflow.md) に沿って local 実行専用、 GitHub Actions 等 CI 経路は使わない
- Gate 2 (mutation MSI) は kiwa release SSOT では非必須のため本 skill 対象外、 別 skill or `scripts/check-mutation-gates.mjs` 直接呼出
- release-smoke の Playwright 依存 test は browser install 済前提、 未 install なら skip 推奨
