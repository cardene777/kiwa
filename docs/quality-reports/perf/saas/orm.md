# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.03ms | 10ms | PASS | stable |
| drizzleSelectAll | 0.44ms | 20ms | PASS | stable |
| drizzleSelectWhere | 0.02ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.15ms | 20ms | PASS |
| drizzleSelectAll | 3.27ms | 40ms | PASS |
| drizzleSelectWhere | 0.22ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -107744 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32224 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 8496 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +16.39% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +10.68% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +24.79% |
| mean | 0.02ms | 0.01ms | +0.00ms | +16.07% |
| min | 0.01ms | 0.01ms | +0.00ms | +9.13% |
| max | 0.05ms | 0.05ms | +0.00ms | +6.20% |
| total | 3.39ms | 2.92ms | +0.47ms | +16.07% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.27ms |
| p95 | 0.44ms |
| p99 | 0.81ms |
| mean | 0.31ms |
| stdev | 0.12ms |
| min | 0.25ms |
| max | 1.17ms |
| total | 61.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.28ms | -0.01ms | -3.54% |
| p95 | 0.44ms | 0.41ms | +0.03ms | +8.42% |
| p99 | 0.81ms | 0.59ms | +0.21ms | +35.99% |
| mean | 0.31ms | 0.29ms | +0.02ms | +5.46% |
| min | 0.25ms | 0.23ms | +0.02ms | +7.45% |
| max | 1.17ms | 0.74ms | +0.43ms | +57.79% |
| total | 61.24ms | 58.06ms | +3.17ms | +5.46% |

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
| max | 0.05ms |
| total | 3.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.41% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +11.88% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +23.80% |
| mean | 0.02ms | 0.02ms | +0.00ms | +6.21% |
| min | 0.02ms | 0.02ms | +0.00ms | +3.71% |
| max | 0.05ms | 0.04ms | +0.01ms | +36.69% |
| total | 3.94ms | 3.71ms | +0.23ms | +6.21% |

