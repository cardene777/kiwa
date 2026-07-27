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
| parseGraphQLOperation | 0.02ms | 10ms | PASS |
| executeQuery | 0.02ms | 10ms | PASS |
| clientQuery | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseGraphQLOperation | -12384 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 28136 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 28264 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.19% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.54% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -7.70% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.15% |
| min | 0.00ms | 0.00ms | -0.00ms | -15.78% |
| max | 0.02ms | 0.01ms | +0.00ms | +22.80% |
| total | 0.24ms | 0.28ms | -0.03ms | -12.15% |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.43% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.47% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +20.12% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.68% |
| min | 0.00ms | 0.00ms | -0.00ms | -20.70% |
| max | 0.01ms | 0.01ms | +0.00ms | +14.69% |
| total | 0.28ms | 0.29ms | -0.01ms | -3.68% |

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
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -18.49% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -30.56% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -25.76% |
| mean | 0.00ms | 0.00ms | -0.00ms | -16.25% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.06% |
| max | 0.02ms | 0.01ms | +0.00ms | +21.27% |
| total | 0.23ms | 0.27ms | -0.04ms | -16.25% |

