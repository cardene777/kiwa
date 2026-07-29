# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.21ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.29ms | 0.51ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.53ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.32ms | 160ms | PASS |
| runA11yForAll | 5.60ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6016 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9232 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -9832 B | 0 B | 102400 B | yes | PASS |

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
| total | 1.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0031ms | -12.76% |
| p50 | 0.03ms | 0.03ms | -0.0046ms | -14.74% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -23.49% |
| p99 | 0.05ms | 0.12ms | -0.07ms | -56.32% |
| mean | 0.03ms | 0.04ms | -0.0085ms | -22.55% |
| min | 0.02ms | 0.02ms | -0.0029ms | -12.20% |
| max | 0.05ms | 0.15ms | -0.10ms | -64.72% |
| total | 1.17ms | 1.51ms | -0.34ms | -22.55% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.13ms |
| p95 | 0.21ms |
| p99 | 0.35ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.11ms |
| max | 0.40ms |
| total | 5.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -10.74% |
| p50 | 0.13ms | 0.14ms | -0.02ms | -11.46% |
| p95 | 0.21ms | 0.20ms | +0.0052ms | +2.59% |
| p99 | 0.35ms | 0.35ms | -0.0033ms | -0.93% |
| mean | 0.14ms | 0.16ms | -0.01ms | -7.17% |
| min | 0.11ms | 0.12ms | -0.01ms | -10.06% |
| max | 0.40ms | 0.42ms | -0.02ms | -5.26% |
| total | 5.79ms | 6.23ms | -0.45ms | -7.17% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.29ms |
| p50 | 0.31ms |
| p95 | 0.51ms |
| p99 | 0.55ms |
| mean | 0.34ms |
| stdev | 0.07ms |
| min | 0.28ms |
| max | 0.55ms |
| total | 13.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.32ms | -0.03ms | -9.45% |
| p50 | 0.31ms | 0.34ms | -0.03ms | -8.50% |
| p95 | 0.51ms | 0.53ms | -0.03ms | -5.29% |
| p99 | 0.55ms | 0.69ms | -0.15ms | -21.20% |
| mean | 0.34ms | 0.37ms | -0.03ms | -9.01% |
| min | 0.28ms | 0.31ms | -0.03ms | -10.80% |
| max | 0.55ms | 0.77ms | -0.22ms | -28.61% |
| total | 13.59ms | 14.93ms | -1.34ms | -9.01% |

