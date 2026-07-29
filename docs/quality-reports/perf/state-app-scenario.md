# Perf Suite — state-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.0045ms | 0.0072ms | 100ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| subscribe_batch (5 listener + 5 state updates) | 0.0027ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 +18% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| dispatch_error_handling (5 unknown action type dispatch) | 0.0085ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 -3% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 0.02ms | 200ms | PASS |
| subscribe_batch (5 listener + 5 state updates) | 0.02ms | 200ms | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (5 provider x 2 dispatch cycles) | 5944 B | 0 B | 102400 B | yes | PASS |
| subscribe_batch (5 listener + 5 state updates) | 616 B | 0 B | 102400 B | yes | PASS |
| dispatch_error_handling (5 unknown action type dispatch) | -2704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (5 provider x 2 dispatch cycles)

# Perf Report — multi_provider_workflow (5 provider x 2 dispatch cycles).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0046ms |
| p95 | 0.0072ms |
| p99 | 0.01ms |
| mean | 0.0052ms |
| stdev | 0.0019ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0026ms | +0.0018ms | +70.09% |
| p50 | 0.0046ms | 0.0046ms | -0.000020ms | -0.44% |
| p95 | 0.0072ms | 0.0076ms | -0.00037ms | -4.89% |
| p99 | 0.01ms | 0.02ms | -0.0035ms | -22.73% |
| mean | 0.0052ms | 0.0049ms | +0.00032ms | +6.57% |
| min | 0.0044ms | 0.0026ms | +0.0018ms | +71.00% |
| max | 0.01ms | 0.02ms | -0.0042ms | -24.69% |
| total | 0.10ms | 0.10ms | +0.0065ms | +6.57% |

### subscribe_batch (5 listener + 5 state updates)

# Perf Report — subscribe_batch (5 listener + 5 state updates).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0027ms |
| p50 | 0.0038ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0042ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0023ms | +0.00042ms | +18.09% |
| p50 | 0.0038ms | 0.0029ms | +0.00085ms | +29.30% |
| p95 | 0.02ms | 0.01ms | +0.0048ms | +42.67% |
| p99 | 0.02ms | 0.01ms | +0.0023ms | +15.35% |
| mean | 0.0051ms | 0.0043ms | +0.00081ms | +19.08% |
| min | 0.0027ms | 0.0022ms | +0.00050ms | +22.64% |
| max | 0.02ms | 0.02ms | +0.0016ms | +10.43% |
| total | 0.10ms | 0.09ms | +0.02ms | +19.08% |

### dispatch_error_handling (5 unknown action type dispatch)

# Perf Report — dispatch_error_handling (5 unknown action type dispatch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0061ms |
| min | 0.0085ms |
| max | 0.04ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0088ms | -0.00024ms | -2.75% |
| p50 | 0.0089ms | 0.0090ms | -0.00010ms | -1.16% |
| p95 | 0.02ms | 0.01ms | +0.0058ms | +50.34% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +105.34% |
| mean | 0.01ms | 0.0096ms | +0.0012ms | +12.72% |
| min | 0.0085ms | 0.0087ms | -0.00017ms | -1.93% |
| max | 0.04ms | 0.02ms | +0.02ms | +114.90% |
| total | 0.22ms | 0.19ms | +0.02ms | +12.72% |

