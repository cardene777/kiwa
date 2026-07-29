# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0061ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0068ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0031ms | 0.0074ms | 100ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.05ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 12296 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 10448 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0063ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0034ms |
| min | 0.0060ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0063ms | -0.00025ms | -4.01% |
| p50 | 0.0063ms | 0.0066ms | -0.00035ms | -5.34% |
| p95 | 0.02ms | 0.02ms | -0.000048ms | -0.29% |
| p99 | 0.02ms | 0.02ms | -0.0027ms | -13.27% |
| mean | 0.0083ms | 0.0088ms | -0.00049ms | -5.52% |
| min | 0.0060ms | 0.0062ms | -0.00021ms | -3.35% |
| max | 0.02ms | 0.02ms | -0.0033ms | -15.84% |
| total | 0.17ms | 0.18ms | -0.0097ms | -5.52% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.0071ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0081ms |
| stdev | 0.0021ms |
| min | 0.0068ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0059ms | +0.00097ms | +16.47% |
| p50 | 0.0071ms | 0.0071ms | -0.000020ms | -0.29% |
| p95 | 0.01ms | 0.02ms | -0.0056ms | -30.30% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -55.19% |
| mean | 0.0081ms | 0.0095ms | -0.0014ms | -15.02% |
| min | 0.0068ms | 0.0058ms | +0.0010ms | +17.29% |
| max | 0.01ms | 0.03ms | -0.02ms | -58.53% |
| total | 0.16ms | 0.19ms | -0.03ms | -15.02% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0031ms |
| p95 | 0.0074ms |
| p99 | 0.01ms |
| mean | 0.0040ms |
| stdev | 0.0020ms |
| min | 0.0030ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.00017ms | -5.26% |
| p50 | 0.0031ms | 0.0033ms | -0.00019ms | -5.63% |
| p95 | 0.0074ms | 0.0054ms | +0.0020ms | +37.53% |
| p99 | 0.01ms | 0.0067ms | +0.0036ms | +53.49% |
| mean | 0.0040ms | 0.0037ms | +0.00021ms | +5.68% |
| min | 0.0030ms | 0.0032ms | -0.00021ms | -6.43% |
| max | 0.01ms | 0.0070ms | +0.0040ms | +56.56% |
| total | 0.08ms | 0.07ms | +0.0043ms | +5.68% |

