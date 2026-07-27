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
| parseGraphQLOperation | 600 B | 0 B | 102400 B | yes | PASS |
| executeQuery | 26056 B | 0 B | 102400 B | yes | PASS |
| clientQuery | 42504 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.67% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +6.18% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -3.86% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.74% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.30% |
| max | 0.01ms | 0.01ms | +0.00ms | +9.42% |
| total | 0.27ms | 0.28ms | -0.01ms | -2.74% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.35% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.56% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +16.25% |
| mean | 0.00ms | 0.00ms | -0.00ms | -3.46% |
| min | 0.00ms | 0.00ms | -0.00ms | -6.87% |
| max | 0.01ms | 0.01ms | +0.00ms | +10.62% |
| total | 0.28ms | 0.29ms | -0.01ms | -3.46% |

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
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.73% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -39.71% |
| p99 | 0.00ms | 0.01ms | -0.00ms | -36.75% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.12% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.39% |
| total | 0.24ms | 0.27ms | -0.03ms | -12.12% |

