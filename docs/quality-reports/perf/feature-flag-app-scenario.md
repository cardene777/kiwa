# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0060ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0075ms | 0.01ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0032ms | 0.0072ms | 100ms | 0.00049ms | PASS | stable (p10 -1% (閾値未満)、 p95 +34% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.04ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | -157136 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 9456 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0063ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0035ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0063ms | -0.00029ms | -4.59% |
| p50 | 0.0063ms | 0.0066ms | -0.00033ms | -5.03% |
| p95 | 0.02ms | 0.02ms | +0.00041ms | +2.47% |
| p99 | 0.02ms | 0.02ms | -0.0028ms | -13.97% |
| mean | 0.0083ms | 0.0088ms | -0.00046ms | -5.19% |
| min | 0.0060ms | 0.0062ms | -0.00021ms | -3.35% |
| max | 0.02ms | 0.02ms | -0.0036ms | -17.23% |
| total | 0.17ms | 0.18ms | -0.0091ms | -5.19% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0075ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0084ms |
| stdev | 0.0017ms |
| min | 0.0071ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0059ms | +0.0016ms | +27.77% |
| p50 | 0.0077ms | 0.0071ms | +0.00063ms | +8.82% |
| p95 | 0.01ms | 0.02ms | -0.0059ms | -31.40% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -57.76% |
| mean | 0.0084ms | 0.0095ms | -0.0011ms | -11.49% |
| min | 0.0071ms | 0.0058ms | +0.0013ms | +23.04% |
| max | 0.01ms | 0.03ms | -0.02ms | -61.30% |
| total | 0.17ms | 0.19ms | -0.02ms | -11.49% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0042ms |
| p95 | 0.0072ms |
| p99 | 0.0077ms |
| mean | 0.0043ms |
| stdev | 0.0013ms |
| min | 0.0032ms |
| max | 0.0079ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0032ms | -0.000046ms | -1.42% |
| p50 | 0.0042ms | 0.0033ms | +0.00083ms | +25.02% |
| p95 | 0.0072ms | 0.0054ms | +0.0018ms | +33.94% |
| p99 | 0.0077ms | 0.0067ms | +0.0011ms | +15.95% |
| mean | 0.0043ms | 0.0037ms | +0.00059ms | +15.64% |
| min | 0.0032ms | 0.0032ms | -0.000084ms | -2.58% |
| max | 0.0079ms | 0.0070ms | +0.00087ms | +12.50% |
| total | 0.09ms | 0.07ms | +0.01ms | +15.64% |

