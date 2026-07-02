---
name: kiwa-perf
description: 汎用性能 test 設計 + 実行 + report + release gate 発火の 5 step skill。 `@kiwa-test/perf-harness` を使って任意 package / example の性能を計測し、 baseline 比較 + regression 検知 + 11 軸 release gate 判定 + markdown report emit まで完結。 kiwa 内 dogfood app と harness 全てに適用可能な汎用 perf 経路。
trigger_keywords:
  - 性能計測
  - perf test
  - p95 計測
  - regression 検知
  - benchmark
  - 性能改善
  - パフォーマンステスト
  - release gate perf
---

# /kiwa-perf

## Step 1

Read the target package or example before writing anything.

- Inspect `package.json`, `src/`, and existing `tests/perf/` if present.
- Detect the benchmark entry points that map to user-facing latency or pure-library hot paths.

## Step 2

Generate a perf spec at `tests/perf-spec-{module}.md`.

- List measured ops.
- Fix iterations and warmup.
- Record baseline path.
- Record thresholds for `p95`, `cost`, `tokens`, and `accuracy`.

## Step 3

Write `tests/perf/{module}.perf.ts`.

- Import `@kiwa-test/perf-harness`.
- Run each op through `measure()`.
- Save a fresh baseline when invoked with `--baseline`.
- Compare against stored baseline when invoked with `--compare`.

## Step 4

Run the suite and capture the result.

- Command: `pnpm exec vitest run tests/perf/ --reporter=verbose`
- Capture the JSON reporter output when the target uses one.

## Step 5

Emit the final markdown report.

- Write `docs/quality-reports/perf/{module}.md`.
- Include `emitPerfReport()` output.
- Append the release gate verdict and regression summary.

## Args

- `--module <name>` required
- `--baseline` save current run as a new baseline
- `--compare` compare against stored baseline and fail on regression

## Gotchas

- `.perf-baseline/` must be gitignored at repo root. Add `echo '.perf-baseline/' >> .gitignore` when missing.

## Usage Flow

Baseline:
`pnpm --filter <target> exec vitest run tests/perf --reporter=verbose -- --baseline`

Compare:
`pnpm --filter <target> exec vitest run tests/perf --reporter=verbose -- --compare`

Standard run:
`pnpm --filter <target> run test:perf`
