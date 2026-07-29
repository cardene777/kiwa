# Perf Suite — feature-flag-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.0062ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.0070ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.0031ms | 0.0081ms | 100ms | 0.00050ms | PASS | stable (p10 -5% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 0.05ms | 200ms | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 0.04ms | 200ms | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 0.01ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluation_workflow (10 evaluateFlag across 4 providers) | 13480 B | 0 B | 102400 B | yes | PASS |
| all_flags_batch (5 evaluateAllFlags with 3 flags) | 9152 B | 0 B | 102400 B | yes | PASS |
| rule_error_handling (5 unknown flag + attribute mismatch) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluation_workflow (10 evaluateFlag across 4 providers)

# Perf Report — evaluation_workflow (10 evaluateFlag across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0029ms |
| min | 0.0061ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0063ms | -0.00017ms | -2.70% |
| p50 | 0.0089ms | 0.0066ms | +0.0023ms | +34.91% |
| p95 | 0.02ms | 0.02ms | -0.0015ms | -9.03% |
| p99 | 0.02ms | 0.02ms | -0.0048ms | -23.64% |
| mean | 0.0087ms | 0.0088ms | -0.000067ms | -0.76% |
| min | 0.0061ms | 0.0062ms | -0.000083ms | -1.34% |
| max | 0.02ms | 0.02ms | -0.0056ms | -26.54% |
| total | 0.17ms | 0.18ms | -0.0013ms | -0.76% |

### all_flags_batch (5 evaluateAllFlags with 3 flags)

# Perf Report — all_flags_batch (5 evaluateAllFlags with 3 flags).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0085ms |
| stdev | 0.0019ms |
| min | 0.0068ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0059ms | +0.0012ms | +19.96% |
| p50 | 0.0079ms | 0.0071ms | +0.00083ms | +11.76% |
| p95 | 0.01ms | 0.02ms | -0.0063ms | -33.57% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -54.41% |
| mean | 0.0085ms | 0.0095ms | -0.0011ms | -11.14% |
| min | 0.0068ms | 0.0058ms | +0.0010ms | +18.01% |
| max | 0.01ms | 0.03ms | -0.02ms | -57.21% |
| total | 0.17ms | 0.19ms | -0.02ms | -11.14% |

### rule_error_handling (5 unknown flag + attribute mismatch)

# Perf Report — rule_error_handling (5 unknown flag + attribute mismatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0032ms |
| p95 | 0.0081ms |
| p99 | 0.01ms |
| mean | 0.0042ms |
| stdev | 0.0026ms |
| min | 0.0031ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0032ms | -0.00017ms | -5.11% |
| p50 | 0.0032ms | 0.0033ms | -0.00015ms | -4.37% |
| p95 | 0.0081ms | 0.0054ms | +0.0027ms | +49.89% |
| p99 | 0.01ms | 0.0067ms | +0.0061ms | +91.42% |
| mean | 0.0042ms | 0.0037ms | +0.00046ms | +12.30% |
| min | 0.0031ms | 0.0032ms | -0.00017ms | -5.14% |
| max | 0.01ms | 0.0070ms | +0.0070ms | +99.40% |
| total | 0.08ms | 0.07ms | +0.0092ms | +12.30% |

