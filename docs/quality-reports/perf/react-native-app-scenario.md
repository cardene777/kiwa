# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0070ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0020ms | 0.0025ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 -7% (閾値未満)、 p95 +23% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.04ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 18744 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 616 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0089ms |
| stdev | 0.0031ms |
| min | 0.0070ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0070ms | 0.0076ms | -0.00055ms | -7.21% |
| p50 | 0.0076ms | 0.02ms | -0.0078ms | -50.61% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -67.37% |
| p99 | 0.02ms | 0.14ms | -0.13ms | -87.20% |
| mean | 0.0089ms | 0.02ms | -0.02ms | -63.32% |
| min | 0.0070ms | 0.0075ms | -0.00054ms | -7.23% |
| max | 0.02ms | 0.17ms | -0.15ms | -88.43% |
| total | 0.18ms | 0.48ms | -0.31ms | -63.32% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0025ms |
| p99 | 0.0027ms |
| mean | 0.0022ms |
| stdev | 0.00017ms |
| min | 0.0020ms |
| max | 0.0027ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0022ms | -0.00017ms | -7.52% |
| p50 | 0.0021ms | 0.0023ms | -0.00021ms | -9.08% |
| p95 | 0.0025ms | 0.0039ms | -0.0014ms | -36.21% |
| p99 | 0.0027ms | 0.0052ms | -0.0025ms | -47.93% |
| mean | 0.0022ms | 0.0025ms | -0.00040ms | -15.55% |
| min | 0.0020ms | 0.0021ms | -0.000084ms | -3.95% |
| max | 0.0027ms | 0.0055ms | -0.0027ms | -50.00% |
| total | 0.04ms | 0.05ms | -0.0079ms | -15.55% |

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
| p10 | 0.01ms | 0.01ms | -0.00092ms | -7.39% |
| p50 | 0.01ms | 0.01ms | -0.00069ms | -5.42% |
| p95 | 0.02ms | 0.01ms | +0.0034ms | +22.97% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +12.82% |
| mean | 0.01ms | 0.01ms | -0.00023ms | -1.72% |
| min | 0.01ms | 0.01ms | -0.0010ms | -8.05% |
| max | 0.02ms | 0.02ms | +0.0024ms | +11.09% |
| total | 0.26ms | 0.27ms | -0.0046ms | -1.72% |

