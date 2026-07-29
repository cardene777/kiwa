# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.0072ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.0022ms | 0.0036ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +35% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 25664 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 184 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0075ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0063ms |
| min | 0.0071ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0076ms | -0.00042ms | -5.56% |
| p50 | 0.0075ms | 0.02ms | -0.0079ms | -51.42% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -54.90% |
| p99 | 0.03ms | 0.14ms | -0.11ms | -78.90% |
| mean | 0.01ms | 0.02ms | -0.01ms | -56.12% |
| min | 0.0071ms | 0.0075ms | -0.00042ms | -5.55% |
| max | 0.03ms | 0.17ms | -0.14ms | -80.39% |
| total | 0.21ms | 0.48ms | -0.27ms | -56.12% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0029ms |
| p95 | 0.0036ms |
| p99 | 0.0045ms |
| mean | 0.0029ms |
| stdev | 0.00065ms |
| min | 0.0022ms |
| max | 0.0048ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | +0.0000010ms | +0.05% |
| p50 | 0.0029ms | 0.0023ms | +0.00060ms | +26.35% |
| p95 | 0.0036ms | 0.0039ms | -0.00031ms | -8.07% |
| p99 | 0.0045ms | 0.0052ms | -0.00063ms | -12.15% |
| mean | 0.0029ms | 0.0025ms | +0.00034ms | +13.35% |
| min | 0.0022ms | 0.0021ms | +0.000083ms | +3.91% |
| max | 0.0048ms | 0.0055ms | -0.00071ms | -12.87% |
| total | 0.06ms | 0.05ms | +0.0068ms | +13.35% |

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
| stdev | 0.0034ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00083ms | -6.69% |
| p50 | 0.01ms | 0.01ms | -0.00073ms | -5.75% |
| p95 | 0.02ms | 0.01ms | +0.0052ms | +34.76% |
| p99 | 0.02ms | 0.02ms | +0.0030ms | +14.86% |
| mean | 0.01ms | 0.01ms | -0.000019ms | -0.14% |
| min | 0.01ms | 0.01ms | -0.00079ms | -6.37% |
| max | 0.02ms | 0.02ms | +0.0025ms | +11.47% |
| total | 0.27ms | 0.27ms | -0.00037ms | -0.14% |

