# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.03ms | 10ms | PASS | stable |
| drizzleSelectAll | 0.35ms | 20ms | PASS | stable |
| drizzleSelectWhere | 0.02ms | 10ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.19ms | 20ms | PASS |
| drizzleSelectAll | 2.74ms | 40ms | PASS |
| drizzleSelectWhere | 0.21ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| drizzleInsert | -119968 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectAll | -32256 B | 0 B | 102400 B | yes | PASS |
| drizzleSelectWhere | 9768 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 2.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.65% |
| p95 | 0.03ms | 0.02ms | +0.00ms | +9.14% |
| p99 | 0.04ms | 0.03ms | +0.00ms | +9.24% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.55% |
| min | 0.01ms | 0.01ms | -0.00ms | -0.37% |
| max | 0.05ms | 0.05ms | +0.00ms | +1.76% |
| total | 2.99ms | 2.92ms | +0.07ms | +2.55% |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.27ms |
| p95 | 0.35ms |
| p99 | 0.37ms |
| mean | 0.28ms |
| stdev | 0.04ms |
| min | 0.24ms |
| max | 0.65ms |
| total | 55.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.27ms | 0.28ms | -0.01ms | -2.49% |
| p95 | 0.35ms | 0.41ms | -0.06ms | -15.39% |
| p99 | 0.37ms | 0.59ms | -0.22ms | -37.38% |
| mean | 0.28ms | 0.29ms | -0.01ms | -3.93% |
| min | 0.24ms | 0.23ms | +0.00ms | +0.32% |
| max | 0.65ms | 0.74ms | -0.10ms | -12.98% |
| total | 55.78ms | 58.06ms | -2.28ms | -3.93% |

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
| max | 0.05ms |
| total | 3.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -0.93% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +7.84% |
| p99 | 0.03ms | 0.03ms | -0.00ms | -0.24% |
| mean | 0.02ms | 0.02ms | -0.00ms | -0.15% |
| min | 0.02ms | 0.02ms | -0.00ms | -0.24% |
| max | 0.05ms | 0.04ms | +0.01ms | +18.62% |
| total | 3.70ms | 3.71ms | -0.01ms | -0.15% |

