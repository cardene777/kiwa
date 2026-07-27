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

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -3664 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 8168 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28712 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -23.43% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -16.40% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -6.71% |
| mean | 0.00ms | 0.00ms | -0.00ms | -15.97% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.78% |
| max | 0.02ms | 0.01ms | +0.00ms | +24.01% |
| total | 0.23ms | 0.28ms | -0.04ms | -15.97% |

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
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -29.05% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.02% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.31% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -34.52% |
| max | 0.02ms | 0.01ms | +0.01ms | +83.27% |
| total | 0.23ms | 0.29ms | -0.06ms | -19.15% |

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
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -18.58% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -45.25% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -40.98% |
| mean | 0.00ms | 0.00ms | -0.00ms | -20.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.06% |
| max | 0.02ms | 0.01ms | +0.00ms | +13.06% |
| total | 0.22ms | 0.27ms | -0.06ms | -20.07% |

