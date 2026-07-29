# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.01ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0023ms | 0.0031ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +4% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.08ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 25056 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 712 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0012ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0076ms | +0.0036ms | +47.25% |
| p50 | 0.01ms | 0.02ms | -0.0040ms | -26.18% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -69.18% |
| p99 | 0.02ms | 0.14ms | -0.13ms | -89.14% |
| mean | 0.01ms | 0.02ms | -0.01ms | -51.39% |
| min | 0.01ms | 0.0075ms | +0.0036ms | +48.33% |
| max | 0.02ms | 0.17ms | -0.15ms | -90.38% |
| total | 0.24ms | 0.48ms | -0.25ms | -51.39% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0023ms |
| p95 | 0.0031ms |
| p99 | 0.0041ms |
| mean | 0.0025ms |
| stdev | 0.00047ms |
| min | 0.0022ms |
| max | 0.0043ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.000084ms | +3.80% |
| p50 | 0.0023ms | 0.0023ms | +0.000041ms | +1.79% |
| p95 | 0.0031ms | 0.0039ms | -0.00081ms | -20.91% |
| p99 | 0.0041ms | 0.0052ms | -0.0011ms | -21.17% |
| mean | 0.0025ms | 0.0025ms | -0.000035ms | -1.39% |
| min | 0.0022ms | 0.0021ms | +0.00012ms | +5.88% |
| max | 0.0043ms | 0.0055ms | -0.0012ms | -21.22% |
| total | 0.05ms | 0.05ms | -0.00071ms | -1.39% |

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
| stdev | 0.0044ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00050ms | +3.98% |
| p50 | 0.01ms | 0.01ms | +0.00048ms | +3.78% |
| p95 | 0.02ms | 0.01ms | +0.0066ms | +44.40% |
| p99 | 0.03ms | 0.02ms | +0.0084ms | +41.42% |
| mean | 0.01ms | 0.01ms | +0.0016ms | +11.96% |
| min | 0.01ms | 0.01ms | +0.00046ms | +3.70% |
| max | 0.03ms | 0.02ms | +0.0089ms | +40.91% |
| total | 0.30ms | 0.27ms | +0.03ms | +11.96% |

