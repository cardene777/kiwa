# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.03ms | 10ms | PASS | stable |
| drizzleSelectAll | 0.35ms | 20ms | PASS | stable |
| drizzleSelectWhere | 0.02ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.14ms | 20ms | PASS |
| drizzleSelectAll | 2.63ms | 40ms | PASS |
| drizzleSelectWhere | 0.20ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -122080 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32224 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 3128 B | 0 B | 102400 B | yes | PASS |

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
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.89% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +6.48% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +13.03% |
| mean | 0.02ms | 0.01ms | +0.00ms | +4.79% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.46% |
| max | 0.05ms | 0.05ms | +0.00ms | +9.39% |
| total | 3.06ms | 2.92ms | +0.14ms | +4.79% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.26ms |
| p95 | 0.35ms |
| p99 | 0.37ms |
| mean | 0.26ms |
| stdev | 0.04ms |
| min | 0.23ms |
| max | 0.55ms |
| total | 52.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.26ms | 0.28ms | -0.02ms | -7.89% |
| p95 | 0.35ms | 0.41ms | -0.06ms | -15.02% |
| p99 | 0.37ms | 0.59ms | -0.22ms | -37.14% |
| mean | 0.26ms | 0.29ms | -0.03ms | -8.98% |
| min | 0.23ms | 0.23ms | -0.01ms | -2.51% |
| max | 0.55ms | 0.74ms | -0.19ms | -25.66% |
| total | 52.85ms | 58.06ms | -5.21ms | -8.98% |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 3.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -3.37% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +2.00% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -9.21% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.86% |
| min | 0.02ms | 0.02ms | -0.00ms | -3.96% |
| max | 0.03ms | 0.04ms | -0.00ms | -8.55% |
| total | 3.60ms | 3.71ms | -0.11ms | -2.86% |

