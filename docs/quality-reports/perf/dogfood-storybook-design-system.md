# Perf Suite — dogfood-storybook-design-system

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| registerAndDiscover | 0.02ms | 0.05ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runPlayFunctionsForAll | 0.11ms | 0.27ms | 80ms | 0.00033ms | PASS | stable (p10 -11% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| runA11yForAll | 0.29ms | 0.48ms | 80ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| registerAndDiscover | 0.37ms | 100ms | PASS |
| runPlayFunctionsForAll | 1.16ms | 160ms | PASS |
| runA11yForAll | 3.54ms | 160ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| registerAndDiscover | -6512 B | 0 B | 102400 B | yes | PASS |
| runPlayFunctionsForAll | -9360 B | 0 B | 102400 B | yes | PASS |
| runA11yForAll | -10480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### registerAndDiscover

# Perf Report — registerAndDiscover.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0096ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 1.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0027ms | -11.08% |
| p50 | 0.02ms | 0.03ms | -0.0070ms | -22.55% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -18.15% |
| p99 | 0.05ms | 0.12ms | -0.06ms | -53.93% |
| mean | 0.03ms | 0.04ms | -0.0088ms | -23.27% |
| min | 0.02ms | 0.02ms | -0.0030ms | -12.54% |
| max | 0.05ms | 0.15ms | -0.09ms | -63.15% |
| total | 1.16ms | 1.51ms | -0.35ms | -23.27% |

### runPlayFunctionsForAll

# Perf Report — runPlayFunctionsForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.11ms |
| p50 | 0.12ms |
| p95 | 0.27ms |
| p99 | 0.34ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.38ms |
| total | 5.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.11ms | 0.12ms | -0.01ms | -10.69% |
| p50 | 0.12ms | 0.14ms | -0.02ms | -14.94% |
| p95 | 0.27ms | 0.20ms | +0.06ms | +31.75% |
| p99 | 0.34ms | 0.35ms | -0.01ms | -3.81% |
| mean | 0.15ms | 0.16ms | -0.01ms | -6.76% |
| min | 0.11ms | 0.12ms | -0.01ms | -9.06% |
| max | 0.38ms | 0.42ms | -0.04ms | -10.45% |
| total | 5.81ms | 6.23ms | -0.42ms | -6.76% |

### runA11yForAll

# Perf Report — runA11yForAll.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.29ms |
| p50 | 0.31ms |
| p95 | 0.48ms |
| p99 | 0.59ms |
| mean | 0.34ms |
| stdev | 0.07ms |
| min | 0.28ms |
| max | 0.60ms |
| total | 13.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.29ms | 0.32ms | -0.03ms | -9.25% |
| p50 | 0.31ms | 0.34ms | -0.03ms | -9.24% |
| p95 | 0.48ms | 0.53ms | -0.05ms | -9.95% |
| p99 | 0.59ms | 0.69ms | -0.10ms | -14.41% |
| mean | 0.34ms | 0.37ms | -0.04ms | -9.85% |
| min | 0.28ms | 0.31ms | -0.03ms | -9.69% |
| max | 0.60ms | 0.77ms | -0.17ms | -21.77% |
| total | 13.46ms | 14.93ms | -1.47ms | -9.85% |

