# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.20ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.28ms | 0.46ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.36ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.91ms | 160ms | PASS |
| runA11yForAll | 3.58ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6512 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9360 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -9776 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0089ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0029ms | -11.80% |
| p50 | 0.03ms | 0.03ms | -0.0050ms | -15.88% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -19.26% |
| p99 | 0.05ms | 0.12ms | -0.06ms | -54.07% |
| mean | 0.03ms | 0.04ms | -0.0087ms | -23.09% |
| min | 0.02ms | 0.02ms | -0.0038ms | -16.03% |
| max | 0.06ms | 0.15ms | -0.09ms | -62.40% |
| total | 1.16ms | 1.51ms | -0.35ms | -23.09% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.20ms |
| p99 | 0.31ms |
| mean | 0.14ms |
| stdev | 0.05ms |
| min | 0.10ms |
| max | 0.37ms |
| total | 5.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.02ms | -13.65% |
| p50 | 0.12ms | 0.14ms | -0.02ms | -15.70% |
| p95 | 0.20ms | 0.20ms | -0.0048ms | -2.37% |
| p99 | 0.31ms | 0.35ms | -0.04ms | -10.84% |
| mean | 0.14ms | 0.16ms | -0.02ms | -12.79% |
| min | 0.10ms | 0.12ms | -0.01ms | -11.86% |
| max | 0.37ms | 0.42ms | -0.05ms | -11.57% |
| total | 5.44ms | 6.23ms | -0.80ms | -12.79% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.28ms |
| p50 | 0.31ms |
| p95 | 0.46ms |
| p99 | 0.54ms |
| mean | 0.33ms |
| stdev | 0.06ms |
| min | 0.27ms |
| max | 0.55ms |
| total | 13.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.28ms | 0.32ms | -0.04ms | -13.31% |
| p50 | 0.31ms | 0.34ms | -0.03ms | -9.43% |
| p95 | 0.46ms | 0.53ms | -0.08ms | -14.07% |
| p99 | 0.54ms | 0.69ms | -0.16ms | -22.37% |
| mean | 0.33ms | 0.37ms | -0.04ms | -10.80% |
| min | 0.27ms | 0.31ms | -0.04ms | -12.59% |
| max | 0.55ms | 0.77ms | -0.22ms | -28.79% |
| total | 13.32ms | 14.93ms | -1.61ms | -10.80% |

