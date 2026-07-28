# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.03ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +1803%) 以上の悪化が必要) |
| drizzleSelectAll | 0.39ms | 20ms | PASS | stable (差 0.07ms が下限 0.5ms 未満で判定を保留) |
| drizzleSelectWhere | 0.02ms | 10ms | PASS | stable (検知には +0.5ms (baseline 比 +1782%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.17ms | 20ms | PASS |
| drizzleSelectAll | 2.99ms | 40ms | PASS |
| drizzleSelectWhere | 0.26ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -100368 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32456 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 9568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.65% |
| p95 | 0.03ms | 0.03ms | -0.00ms | -5.44% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -16.36% |
| mean | 0.02ms | 0.02ms | -0.00ms | -4.85% |
| min | 0.01ms | 0.01ms | +0.00ms | +4.08% |
| max | 0.05ms | 0.10ms | -0.05ms | -46.59% |
| total | 3.30ms | 3.47ms | -0.17ms | -4.85% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.25ms |
| p95 | 0.39ms |
| p99 | 0.52ms |
| mean | 0.28ms |
| stdev | 0.06ms |
| min | 0.24ms |
| max | 0.75ms |
| total | 55.42ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.25ms | 0.25ms | +0.00ms | +1.02% |
| p95 | 0.39ms | 0.31ms | +0.07ms | +24.04% |
| p99 | 0.52ms | 0.33ms | +0.19ms | +55.70% |
| mean | 0.28ms | 0.26ms | +0.01ms | +5.33% |
| min | 0.24ms | 0.24ms | +0.00ms | +1.19% |
| max | 0.75ms | 0.56ms | +0.19ms | +34.53% |
| total | 55.42ms | 52.62ms | +2.80ms | +5.33% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 4.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +6.68% |
| p95 | 0.02ms | 0.03ms | -0.00ms | -15.55% |
| p99 | 0.04ms | 0.06ms | -0.03ms | -45.54% |
| mean | 0.02ms | 0.02ms | -0.00ms | -3.65% |
| min | 0.02ms | 0.02ms | +0.00ms | +6.49% |
| max | 0.04ms | 0.25ms | -0.21ms | -84.32% |
| total | 4.10ms | 4.25ms | -0.15ms | -3.65% |

