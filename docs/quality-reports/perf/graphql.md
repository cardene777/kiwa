# Perf Suite — graphql

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseGraphQLOperation | 0.00ms | 5ms | PASS | stable |
| executeQuery | 0.00ms | 5ms | PASS | stable |
| clientQuery | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseGraphQLOperation | 0.01ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| parseGraphQLOperation | 141176 B | 0 B | 102400 B | PASS |
| executeQuery | 878216 B | 0 B | 102400 B | PASS |
| clientQuery | 945320 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### parseGraphQLOperation

# Perf Report — parseGraphQLOperation.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -5.04% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.08% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +28.99% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.03% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +107.84% |
| total | 0.25ms | 0.23ms | +0.03ms | +12.03% |

### executeQuery

# Perf Report — executeQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.10% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -18.42% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +6.45% |
| mean | 0.00ms | 0.00ms | -0.00ms | -14.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.31% |
| max | 0.01ms | 0.01ms | +0.00ms | +9.23% |
| total | 0.25ms | 0.29ms | -0.04ms | -14.82% |

### clientQuery

# Perf Report — clientQuery.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.07ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -4.69% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -37.61% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -40.50% |
| mean | 0.00ms | 0.00ms | -0.00ms | -47.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.47% |
| max | 0.07ms | 0.27ms | -0.20ms | -75.40% |
| total | 0.26ms | 0.49ms | -0.23ms | -47.87% |

