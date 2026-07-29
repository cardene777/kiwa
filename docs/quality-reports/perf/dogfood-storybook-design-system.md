# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.30ms | 80ms | 0.00033ms | PASS | stable (p10 -6% (閾値未満)、 p95 +49% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.28ms | 0.47ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.47ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.21ms | 160ms | PASS |
| runA11yForAll | 7.86ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6344 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9920 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -9824 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0021ms | -8.71% |
| p50 | 0.03ms | 0.03ms | -0.0051ms | -16.35% |
| p95 | 0.05ms | 0.06ms | -0.0088ms | -13.80% |
| p99 | 0.07ms | 0.12ms | -0.04ms | -37.46% |
| mean | 0.03ms | 0.04ms | -0.0060ms | -15.83% |
| min | 0.02ms | 0.02ms | -0.0021ms | -8.71% |
| max | 0.08ms | 0.15ms | -0.06ms | -43.51% |
| total | 1.27ms | 1.51ms | -0.24ms | -15.83% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.14ms |
| p95 | 0.30ms |
| p99 | 0.38ms |
| mean | 0.16ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.40ms |
| total | 6.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.0073ms | -5.95% |
| p50 | 0.14ms | 0.14ms | +0.0022ms | +1.54% |
| p95 | 0.30ms | 0.20ms | +0.10ms | +49.38% |
| p99 | 0.38ms | 0.35ms | +0.03ms | +8.20% |
| mean | 0.16ms | 0.16ms | +0.0051ms | +3.24% |
| min | 0.11ms | 0.12ms | -0.0063ms | -5.35% |
| max | 0.40ms | 0.42ms | -0.02ms | -3.97% |
| total | 6.44ms | 6.23ms | +0.20ms | +3.24% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.28ms |
| p50 | 0.30ms |
| p95 | 0.47ms |
| p99 | 0.52ms |
| mean | 0.33ms |
| stdev | 0.06ms |
| min | 0.28ms |
| max | 0.53ms |
| total | 13.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.28ms | 0.32ms | -0.04ms | -11.66% |
| p50 | 0.30ms | 0.34ms | -0.04ms | -11.45% |
| p95 | 0.47ms | 0.53ms | -0.06ms | -11.15% |
| p99 | 0.52ms | 0.69ms | -0.17ms | -25.20% |
| mean | 0.33ms | 0.37ms | -0.05ms | -12.89% |
| min | 0.28ms | 0.31ms | -0.03ms | -11.01% |
| max | 0.53ms | 0.77ms | -0.24ms | -31.28% |
| total | 13.01ms | 14.93ms | -1.92ms | -12.89% |

