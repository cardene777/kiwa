# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0059ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0065ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0030ms | 0.0069ms | 100ms | 0.00042ms | PASS | stable (p10 -8% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.06ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.02ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | -159424 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 10640 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | -360 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0073ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0045ms |
| min | 0.0059ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0063ms | -0.00038ms | -6.05% |
| p50 | 0.0073ms | 0.0066ms | +0.00069ms | +10.38% |
| p95 | 0.02ms | 0.02ms | +0.00099ms | +5.96% |
| p99 | 0.02ms | 0.02ms | +0.00027ms | +1.31% |
| mean | 0.0094ms | 0.0088ms | +0.00056ms | +6.37% |
| min | 0.0059ms | 0.0062ms | -0.00033ms | -5.36% |
| max | 0.02ms | 0.02ms | +0.000083ms | +0.39% |
| total | 0.19ms | 0.18ms | +0.01ms | +6.37% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0065ms |
| p50 | 0.0067ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0072ms |
| stdev | 0.0015ms |
| min | 0.0065ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0065ms | 0.0059ms | +0.00067ms | +11.44% |
| p50 | 0.0067ms | 0.0071ms | -0.00042ms | -5.88% |
| p95 | 0.01ms | 0.02ms | -0.0081ms | -43.51% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -61.20% |
| mean | 0.0072ms | 0.0095ms | -0.0023ms | -23.88% |
| min | 0.0065ms | 0.0058ms | +0.00071ms | +12.24% |
| max | 0.01ms | 0.03ms | -0.02ms | -63.58% |
| total | 0.14ms | 0.19ms | -0.05ms | -23.88% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0069ms |
| p99 | 0.01ms |
| mean | 0.0039ms |
| stdev | 0.0027ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0032ms | -0.00025ms | -7.69% |
| p50 | 0.0031ms | 0.0033ms | -0.00025ms | -7.50% |
| p95 | 0.0069ms | 0.0054ms | +0.0015ms | +28.11% |
| p99 | 0.01ms | 0.0067ms | +0.0068ms | +101.40% |
| mean | 0.0039ms | 0.0037ms | +0.00020ms | +5.29% |
| min | 0.0030ms | 0.0032ms | -0.00029ms | -8.95% |
| max | 0.02ms | 0.0070ms | +0.0081ms | +115.47% |
| total | 0.08ms | 0.07ms | +0.0040ms | +5.29% |

