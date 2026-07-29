# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0049ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0029ms | 0.0089ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0092ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +4% (閾値未満)、 p95 +102% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.21ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 3960 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | -3360 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 2328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0050ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0025ms |
| min | 0.0048ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0026ms | +0.0022ms | +85.85% |
| p50 | 0.0050ms | 0.0046ms | +0.00040ms | +8.56% |
| p95 | 0.01ms | 0.0076ms | +0.0037ms | +48.98% |
| p99 | 0.01ms | 0.02ms | -0.0012ms | -8.00% |
| mean | 0.0060ms | 0.0049ms | +0.0011ms | +22.33% |
| min | 0.0048ms | 0.0026ms | +0.0022ms | +87.11% |
| max | 0.01ms | 0.02ms | -0.0025ms | -14.28% |
| total | 0.12ms | 0.10ms | +0.02ms | +22.33% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0089ms |
| p99 | 0.01ms |
| mean | 0.0041ms |
| stdev | 0.0025ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0023ms | +0.00059ms | +25.25% |
| p50 | 0.0030ms | 0.0029ms | +0.000084ms | +2.86% |
| p95 | 0.0089ms | 0.01ms | -0.0023ms | -20.52% |
| p99 | 0.01ms | 0.01ms | -0.0025ms | -16.96% |
| mean | 0.0041ms | 0.0043ms | -0.00021ms | -4.84% |
| min | 0.0029ms | 0.0022ms | +0.00071ms | +32.07% |
| max | 0.01ms | 0.02ms | -0.0025ms | -16.31% |
| total | 0.08ms | 0.09ms | -0.0041ms | -4.84% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.09ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0090ms |
| max | 0.10ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0088ms | +0.00038ms | +4.28% |
| p50 | 0.0096ms | 0.0090ms | +0.00063ms | +6.98% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +102.06% |
| p99 | 0.09ms | 0.02ms | +0.07ms | +460.00% |
| mean | 0.01ms | 0.0096ms | +0.0054ms | +56.53% |
| min | 0.0090ms | 0.0087ms | +0.00033ms | +3.84% |
| max | 0.10ms | 0.02ms | +0.09ms | +522.22% |
| total | 0.30ms | 0.19ms | +0.11ms | +56.53% |

