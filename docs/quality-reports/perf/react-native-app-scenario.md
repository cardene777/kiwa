# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0072ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0021ms | 0.0046ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable (p10 -5% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.06ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 13592 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 712 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0078ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0027ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0076ms | -0.00034ms | -4.46% |
| p50 | 0.0078ms | 0.02ms | -0.0077ms | -49.66% |
| p95 | 0.01ms | 0.04ms | -0.03ms | -68.00% |
| p99 | 0.02ms | 0.14ms | -0.13ms | -88.87% |
| mean | 0.0091ms | 0.02ms | -0.02ms | -62.30% |
| min | 0.0072ms | 0.0075ms | -0.00033ms | -4.45% |
| max | 0.02ms | 0.17ms | -0.15ms | -90.16% |
| total | 0.18ms | 0.48ms | -0.30ms | -62.30% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0031ms |
| p95 | 0.0046ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0020ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000087ms | -3.94% |
| p50 | 0.0031ms | 0.0023ms | +0.00085ms | +37.26% |
| p95 | 0.0046ms | 0.0039ms | +0.00074ms | +18.96% |
| p99 | 0.01ms | 0.0052ms | +0.0049ms | +95.59% |
| mean | 0.0034ms | 0.0025ms | +0.00090ms | +35.19% |
| min | 0.0021ms | 0.0021ms | -0.000042ms | -1.98% |
| max | 0.01ms | 0.0055ms | +0.0060ms | +109.09% |
| total | 0.07ms | 0.05ms | +0.02ms | +35.19% |

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
| p10 | 0.01ms | 0.01ms | -0.00063ms | -5.02% |
| p50 | 0.01ms | 0.01ms | -0.00056ms | -4.43% |
| p95 | 0.02ms | 0.01ms | +0.0052ms | +35.31% |
| p99 | 0.02ms | 0.02ms | +0.0031ms | +15.10% |
| mean | 0.01ms | 0.01ms | +0.00016ms | +1.20% |
| min | 0.01ms | 0.01ms | -0.00067ms | -5.36% |
| max | 0.02ms | 0.02ms | +0.0025ms | +11.66% |
| total | 0.27ms | 0.27ms | +0.0032ms | +1.20% |

