# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.22ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.29ms | 0.50ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.47ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.42ms | 160ms | PASS |
| runA11yForAll | 6.94ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -5904 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -10432 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -9856 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0087ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0023ms | -9.40% |
| p50 | 0.03ms | 0.03ms | -0.0028ms | -8.81% |
| p95 | 0.05ms | 0.06ms | -0.02ms | -25.51% |
| p99 | 0.05ms | 0.12ms | -0.07ms | -56.77% |
| mean | 0.03ms | 0.04ms | -0.0071ms | -18.89% |
| min | 0.02ms | 0.02ms | -0.0022ms | -9.06% |
| max | 0.05ms | 0.15ms | -0.10ms | -64.47% |
| total | 1.23ms | 1.51ms | -0.29ms | -18.89% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.22ms |
| p99 | 0.34ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.10ms |
| max | 0.39ms |
| total | 5.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.02ms | -13.60% |
| p50 | 0.12ms | 0.14ms | -0.02ms | -16.65% |
| p95 | 0.22ms | 0.20ms | +0.02ms | +10.85% |
| p99 | 0.34ms | 0.35ms | -0.02ms | -4.42% |
| mean | 0.14ms | 0.16ms | -0.02ms | -12.61% |
| min | 0.10ms | 0.12ms | -0.01ms | -11.26% |
| max | 0.39ms | 0.42ms | -0.03ms | -6.54% |
| total | 5.45ms | 6.23ms | -0.79ms | -12.61% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.29ms |
| p50 | 0.31ms |
| p95 | 0.50ms |
| p99 | 0.81ms |
| mean | 0.35ms |
| stdev | 0.12ms |
| min | 0.28ms |
| max | 0.93ms |
| total | 13.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.32ms | -0.03ms | -9.38% |
| p50 | 0.31ms | 0.34ms | -0.04ms | -10.87% |
| p95 | 0.50ms | 0.53ms | -0.04ms | -6.67% |
| p99 | 0.81ms | 0.69ms | +0.12ms | +17.02% |
| mean | 0.35ms | 0.37ms | -0.02ms | -6.54% |
| min | 0.28ms | 0.31ms | -0.03ms | -9.88% |
| max | 0.93ms | 0.77ms | +0.16ms | +20.63% |
| total | 13.95ms | 14.93ms | -0.98ms | -6.54% |

