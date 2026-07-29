# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0077ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0021ms | 0.0026ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.04ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 24120 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 88 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0076ms | +0.00012ms | +1.58% |
| p50 | 0.01ms | 0.02ms | -0.0038ms | -24.43% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -56.29% |
| p99 | 0.02ms | 0.14ms | -0.12ms | -85.51% |
| mean | 0.01ms | 0.02ms | -0.01ms | -51.41% |
| min | 0.0073ms | 0.0075ms | -0.00025ms | -3.33% |
| max | 0.02ms | 0.17ms | -0.15ms | -87.32% |
| total | 0.24ms | 0.48ms | -0.25ms | -51.41% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0021ms |
| p95 | 0.0026ms |
| p99 | 0.0029ms |
| mean | 0.0022ms |
| stdev | 0.00021ms |
| min | 0.0021ms |
| max | 0.0030ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000083ms | -3.76% |
| p50 | 0.0021ms | 0.0023ms | -0.00017ms | -7.29% |
| p95 | 0.0026ms | 0.0039ms | -0.0012ms | -31.87% |
| p99 | 0.0029ms | 0.0052ms | -0.0023ms | -44.05% |
| mean | 0.0022ms | 0.0025ms | -0.00033ms | -12.85% |
| min | 0.0021ms | 0.0021ms | -0.000042ms | -1.98% |
| max | 0.0030ms | 0.0055ms | -0.0025ms | -46.20% |
| total | 0.04ms | 0.05ms | -0.0065ms | -12.85% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0038ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0010ms | -8.09% |
| p50 | 0.01ms | 0.01ms | -0.00073ms | -5.75% |
| p95 | 0.02ms | 0.01ms | +0.0028ms | +19.03% |
| p99 | 0.03ms | 0.02ms | +0.0058ms | +28.42% |
| mean | 0.01ms | 0.01ms | -0.000058ms | -0.44% |
| min | 0.01ms | 0.01ms | -0.0011ms | -8.72% |
| max | 0.03ms | 0.02ms | +0.0065ms | +30.02% |
| total | 0.27ms | 0.27ms | -0.0012ms | -0.44% |

