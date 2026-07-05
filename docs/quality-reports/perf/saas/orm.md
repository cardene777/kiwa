# Perf Suite — orm

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| drizzleInsert | 0.02ms | 10ms | PASS | n/a (baseline seeded) |
| drizzleSelectAll | 0.35ms | 20ms | PASS | n/a (baseline seeded) |
| drizzleSelectWhere | 0.02ms | 10ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| drizzleInsert | 0.21ms | 20ms | PASS |
| drizzleSelectAll | 3.41ms | 40ms | PASS |
| drizzleSelectWhere | 0.13ms | 20ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| drizzleInsert | 3571448 B | 0 B | 102400 B | PASS |
| drizzleSelectAll | -13597792 B | 0 B | 102400 B | PASS |
| drizzleSelectWhere | 3884424 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### drizzleInsert

# Perf Report — drizzleInsert.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 3.25ms |

### drizzleSelectAll

# Perf Report — drizzleSelectAll.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.27ms |
| p95 | 0.35ms |
| p99 | 0.58ms |
| mean | 0.31ms |
| stdev | 0.37ms |
| min | 0.23ms |
| max | 4.58ms |
| total | 62.20ms |

### drizzleSelectWhere

# Perf Report — drizzleSelectWhere.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 2.69ms |

