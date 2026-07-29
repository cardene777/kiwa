# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0073ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0021ms | 0.0033ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -6% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 192240 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | -296 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0077ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0093ms |
| stdev | 0.0028ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0076ms | -0.00030ms | -3.92% |
| p50 | 0.0077ms | 0.02ms | -0.0077ms | -50.20% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -65.66% |
| p99 | 0.02ms | 0.14ms | -0.13ms | -88.80% |
| mean | 0.0093ms | 0.02ms | -0.01ms | -61.76% |
| min | 0.0073ms | 0.0075ms | -0.00025ms | -3.33% |
| max | 0.02ms | 0.17ms | -0.15ms | -90.23% |
| total | 0.19ms | 0.48ms | -0.30ms | -61.76% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0033ms |
| p99 | 0.0071ms |
| mean | 0.0025ms |
| stdev | 0.0013ms |
| min | 0.0021ms |
| max | 0.0080ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.00012ms | -5.62% |
| p50 | 0.0022ms | 0.0023ms | -0.00013ms | -5.45% |
| p95 | 0.0033ms | 0.0039ms | -0.00059ms | -15.10% |
| p99 | 0.0071ms | 0.0052ms | +0.0019ms | +37.03% |
| mean | 0.0025ms | 0.0025ms | -0.000021ms | -0.81% |
| min | 0.0021ms | 0.0021ms | -0.000042ms | -1.98% |
| max | 0.0080ms | 0.0055ms | +0.0025ms | +46.22% |
| total | 0.05ms | 0.05ms | -0.00041ms | -0.81% |

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
| stdev | 0.0033ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00079ms | -6.35% |
| p50 | 0.01ms | 0.01ms | -0.00077ms | -6.08% |
| p95 | 0.02ms | 0.01ms | +0.0036ms | +24.52% |
| p99 | 0.02ms | 0.02ms | +0.0032ms | +15.49% |
| mean | 0.01ms | 0.01ms | -0.000041ms | -0.31% |
| min | 0.01ms | 0.01ms | -0.00079ms | -6.37% |
| max | 0.02ms | 0.02ms | +0.0030ms | +13.95% |
| total | 0.27ms | 0.27ms | -0.00083ms | -0.31% |

