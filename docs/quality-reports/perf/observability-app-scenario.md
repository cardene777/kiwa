# Perf Suite — observability-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.04ms | 0.08ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_history_detect (200 test × 5 run) | 0.07ms | 0.18ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| threshold_varying_workload (10 different threshold) | 0.05ms | 0.05ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | 0.30ms | 200ms | PASS |
| large_history_detect (200 test × 5 run) | 0.40ms | 200ms | PASS |
| threshold_varying_workload (10 different threshold) | 0.26ms | 200ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| flaky_detect_burst (50 test × 10 run history detect) | -7672 B | 0 B | 102400 B | yes | PASS |
| large_history_detect (200 test × 5 run) | 6032 B | 0 B | 102400 B | yes | PASS |
| threshold_varying_workload (10 different threshold) | 768 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### flaky_detect_burst (50 test × 10 run history detect)

# Perf Report — flaky_detect_burst (50 test × 10 run history detect).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0056ms | -13.51% |
| p50 | 0.05ms | 0.06ms | -0.01ms | -23.55% |
| p95 | 0.08ms | 0.11ms | -0.03ms | -29.43% |
| p99 | 0.09ms | 0.17ms | -0.08ms | -45.20% |
| mean | 0.05ms | 0.07ms | -0.02ms | -22.91% |
| min | 0.03ms | 0.04ms | -0.0057ms | -14.20% |
| max | 0.10ms | 0.18ms | -0.09ms | -48.01% |
| total | 1.56ms | 2.02ms | -0.46ms | -22.91% |

### large_history_detect (200 test × 5 run)

# Perf Report — large_history_detect (200 test × 5 run).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.07ms |
| p50 | 0.07ms |
| p95 | 0.18ms |
| p99 | 0.27ms |
| mean | 0.09ms |
| stdev | 0.05ms |
| min | 0.07ms |
| max | 0.30ms |
| total | 2.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.07ms | 0.08ms | -0.0080ms | -10.50% |
| p50 | 0.07ms | 0.10ms | -0.03ms | -26.48% |
| p95 | 0.18ms | 0.31ms | -0.13ms | -41.46% |
| p99 | 0.27ms | 0.49ms | -0.21ms | -43.41% |
| mean | 0.09ms | 0.14ms | -0.06ms | -39.69% |
| min | 0.07ms | 0.07ms | -0.0047ms | -6.44% |
| max | 0.30ms | 0.54ms | -0.23ms | -43.38% |
| total | 2.58ms | 4.28ms | -1.70ms | -39.69% |

### threshold_varying_workload (10 different threshold)

# Perf Report — threshold_varying_workload (10 different threshold).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0052ms |
| min | 0.05ms |
| max | 0.07ms |
| total | 1.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0061ms | -11.79% |
| p50 | 0.05ms | 0.06ms | -0.01ms | -17.78% |
| p95 | 0.05ms | 0.16ms | -0.11ms | -67.50% |
| p99 | 0.07ms | 0.28ms | -0.21ms | -75.78% |
| mean | 0.05ms | 0.08ms | -0.03ms | -41.10% |
| min | 0.05ms | 0.05ms | -0.0059ms | -11.60% |
| max | 0.07ms | 0.33ms | -0.25ms | -77.45% |
| total | 1.43ms | 2.43ms | -1.00ms | -41.10% |

