# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.03ms | 0.05ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.49ms | 80ms | 0.00042ms | PASS | stable (p10 -9% (閾値未満)、 p95 +140% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.29ms | 0.48ms | 80ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.47ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.50ms | 160ms | PASS |
| runA11yForAll | 3.64ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6512 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9888 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -7712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.06ms |
| mean | 0.04ms |
| stdev | 0.0087ms |
| min | 0.02ms |
| max | 0.06ms |
| total | 1.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.02ms | +0.0012ms | +4.91% |
| p50 | 0.03ms | 0.03ms | +0.0030ms | +9.47% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -16.65% |
| p99 | 0.06ms | 0.12ms | -0.06ms | -51.79% |
| mean | 0.04ms | 0.04ms | -0.0015ms | -4.09% |
| min | 0.02ms | 0.02ms | +0.0010ms | +4.35% |
| max | 0.06ms | 0.15ms | -0.09ms | -61.08% |
| total | 1.45ms | 1.51ms | -0.06ms | -4.09% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.49ms |
| p99 | 0.67ms |
| mean | 0.19ms |
| stdev | 0.14ms |
| min | 0.11ms |
| max | 0.71ms |
| total | 7.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -8.73% |
| p50 | 0.14ms | 0.14ms | -0.0047ms | -3.28% |
| p95 | 0.49ms | 0.20ms | +0.28ms | +140.19% |
| p99 | 0.67ms | 0.35ms | +0.31ms | +88.46% |
| mean | 0.19ms | 0.16ms | +0.04ms | +23.75% |
| min | 0.11ms | 0.12ms | -0.0081ms | -6.87% |
| max | 0.71ms | 0.42ms | +0.29ms | +70.01% |
| total | 7.71ms | 6.23ms | +1.48ms | +23.75% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.29ms |
| p50 | 0.33ms |
| p95 | 0.48ms |
| p99 | 0.61ms |
| mean | 0.35ms |
| stdev | 0.07ms |
| min | 0.29ms |
| max | 0.62ms |
| total | 13.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.32ms | -0.02ms | -7.66% |
| p50 | 0.33ms | 0.34ms | -0.02ms | -4.66% |
| p95 | 0.48ms | 0.53ms | -0.05ms | -10.06% |
| p99 | 0.61ms | 0.69ms | -0.09ms | -12.27% |
| mean | 0.35ms | 0.37ms | -0.03ms | -6.89% |
| min | 0.29ms | 0.31ms | -0.02ms | -6.56% |
| max | 0.62ms | 0.77ms | -0.15ms | -19.01% |
| total | 13.90ms | 14.93ms | -1.03ms | -6.89% |

