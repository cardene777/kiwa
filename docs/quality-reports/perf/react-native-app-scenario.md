# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00057ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0073ms | 0.01ms | 100ms | 0.00057ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0021ms | 0.0030ms | 100ms | 0.00057ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00057ms | PASS | stable (p10 -6% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.04ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 25672 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 616 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0075ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0092ms |
| stdev | 0.0030ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0076ms | -0.00030ms | -3.92% |
| p50 | 0.0075ms | 0.02ms | -0.0079ms | -51.42% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -68.23% |
| p99 | 0.02ms | 0.14ms | -0.13ms | -88.16% |
| mean | 0.0092ms | 0.02ms | -0.02ms | -62.11% |
| min | 0.0072ms | 0.0075ms | -0.00029ms | -3.89% |
| max | 0.02ms | 0.17ms | -0.15ms | -89.40% |
| total | 0.18ms | 0.48ms | -0.30ms | -62.11% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0021ms |
| p95 | 0.0030ms |
| p99 | 0.0030ms |
| mean | 0.0023ms |
| stdev | 0.00029ms |
| min | 0.0021ms |
| max | 0.0030ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.00012ms | -5.66% |
| p50 | 0.0021ms | 0.0023ms | -0.00017ms | -7.29% |
| p95 | 0.0030ms | 0.0039ms | -0.00088ms | -22.63% |
| p99 | 0.0030ms | 0.0052ms | -0.0022ms | -42.03% |
| mean | 0.0023ms | 0.0025ms | -0.00028ms | -10.89% |
| min | 0.0021ms | 0.0021ms | -0.000042ms | -1.98% |
| max | 0.0030ms | 0.0055ms | -0.0025ms | -45.45% |
| total | 0.05ms | 0.05ms | -0.0055ms | -10.89% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0030ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00071ms | -5.72% |
| p50 | 0.01ms | 0.01ms | -0.00067ms | -5.25% |
| p95 | 0.02ms | 0.01ms | +0.0030ms | +20.06% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +12.56% |
| mean | 0.01ms | 0.01ms | -0.00013ms | -0.95% |
| min | 0.01ms | 0.01ms | -0.00075ms | -6.03% |
| max | 0.02ms | 0.02ms | +0.0025ms | +11.28% |
| total | 0.26ms | 0.27ms | -0.0025ms | -0.95% |

