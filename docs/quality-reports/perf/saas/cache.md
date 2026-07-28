# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| redisEnvAccessor | 0.00ms | 5ms | PASS | stable |
| memcachedEnvAccessor | 0.00ms | 5ms | PASS | stable |
| keydbEnvAccessor | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -12200 B | -50391 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | 3816 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 1632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +111.75% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +102.72% |
| mean | 0.00ms | 0.00ms | +0.00ms | +44.31% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +243.59% |
| total | 0.07ms | 0.05ms | +0.02ms | +44.31% |

### memcachedEnvAccessor

# Perf Report — memcachedEnvAccessor.serial

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
| max | 0.00ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.60% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.23% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +30.51% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.49% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +47.89% |
| total | 0.04ms | 0.03ms | +0.01ms | +18.49% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.02% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.00% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.31% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.21% |
| total | 0.04ms | 0.04ms | +0.00ms | +12.31% |

