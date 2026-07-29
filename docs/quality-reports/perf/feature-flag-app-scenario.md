# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0067ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0067ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0031ms | 0.0068ms | 100ms | 0.00042ms | PASS | stable (p10 -4% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.06ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 11072 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 9120 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | -360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0068ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0090ms |
| stdev | 0.0039ms |
| min | 0.0066ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0063ms | +0.00033ms | +5.27% |
| p50 | 0.0068ms | 0.0066ms | +0.00019ms | +2.83% |
| p95 | 0.02ms | 0.02ms | +0.0013ms | +7.75% |
| p99 | 0.02ms | 0.02ms | +0.000025ms | +0.12% |
| mean | 0.0090ms | 0.0088ms | +0.00025ms | +2.87% |
| min | 0.0066ms | 0.0062ms | +0.00038ms | +6.04% |
| max | 0.02ms | 0.02ms | -0.00029ms | -1.39% |
| total | 0.18ms | 0.18ms | +0.0050ms | +2.87% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0075ms |
| stdev | 0.0015ms |
| min | 0.0067ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0059ms | +0.00084ms | +14.34% |
| p50 | 0.0069ms | 0.0071ms | -0.00017ms | -2.36% |
| p95 | 0.01ms | 0.02ms | -0.0070ms | -37.76% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -62.32% |
| mean | 0.0075ms | 0.0095ms | -0.0020ms | -21.32% |
| min | 0.0067ms | 0.0058ms | +0.00087ms | +15.11% |
| max | 0.01ms | 0.03ms | -0.02ms | -65.62% |
| total | 0.15ms | 0.19ms | -0.04ms | -21.32% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0032ms |
| p95 | 0.0068ms |
| p99 | 0.0081ms |
| mean | 0.0038ms |
| stdev | 0.0014ms |
| min | 0.0031ms |
| max | 0.0084ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.00013ms | -3.97% |
| p50 | 0.0032ms | 0.0033ms | -0.00010ms | -3.11% |
| p95 | 0.0068ms | 0.0054ms | +0.0015ms | +27.08% |
| p99 | 0.0081ms | 0.0067ms | +0.0014ms | +21.34% |
| mean | 0.0038ms | 0.0037ms | +0.000086ms | +2.29% |
| min | 0.0031ms | 0.0032ms | -0.00017ms | -5.14% |
| max | 0.0084ms | 0.0070ms | +0.0014ms | +20.24% |
| total | 0.08ms | 0.07ms | +0.0017ms | +2.29% |

