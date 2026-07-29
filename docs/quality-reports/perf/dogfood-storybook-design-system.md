# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.10ms | 0.22ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.31ms | 0.79ms | 80ms | 0.00033ms | PASS | stable (p10 -3% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.42ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.25ms | 160ms | PASS |
| runA11yForAll | 7.36ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6448 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -18384 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -10048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 1.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0025ms | -10.05% |
| p50 | 0.03ms | 0.03ms | -0.0060ms | -19.28% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.59% |
| p99 | 0.06ms | 0.12ms | -0.06ms | -52.51% |
| mean | 0.03ms | 0.04ms | -0.0075ms | -19.71% |
| min | 0.02ms | 0.02ms | -0.0023ms | -9.76% |
| max | 0.06ms | 0.15ms | -0.09ms | -60.58% |
| total | 1.22ms | 1.51ms | -0.30ms | -19.71% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.10ms |
| p50 | 0.11ms |
| p95 | 0.22ms |
| p99 | 0.29ms |
| mean | 0.13ms |
| stdev | 0.05ms |
| min | 0.10ms |
| max | 0.33ms |
| total | 5.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.12ms | -0.02ms | -16.12% |
| p50 | 0.11ms | 0.14ms | -0.03ms | -20.44% |
| p95 | 0.22ms | 0.20ms | +0.02ms | +8.13% |
| p99 | 0.29ms | 0.35ms | -0.06ms | -17.85% |
| mean | 0.13ms | 0.16ms | -0.03ms | -16.54% |
| min | 0.10ms | 0.12ms | -0.02ms | -14.27% |
| max | 0.33ms | 0.42ms | -0.09ms | -21.36% |
| total | 5.20ms | 6.23ms | -1.03ms | -16.54% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.31ms |
| p50 | 0.33ms |
| p95 | 0.79ms |
| p99 | 0.93ms |
| mean | 0.40ms |
| stdev | 0.17ms |
| min | 0.28ms |
| max | 0.93ms |
| total | 16.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.31ms | 0.32ms | -0.0087ms | -2.74% |
| p50 | 0.33ms | 0.34ms | -0.01ms | -3.55% |
| p95 | 0.79ms | 0.53ms | +0.25ms | +47.45% |
| p99 | 0.93ms | 0.69ms | +0.23ms | +33.78% |
| mean | 0.40ms | 0.37ms | +0.03ms | +7.59% |
| min | 0.28ms | 0.31ms | -0.03ms | -8.74% |
| max | 0.93ms | 0.77ms | +0.16ms | +20.68% |
| total | 16.06ms | 14.93ms | +1.13ms | +7.59% |

