# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| redisEnvAccessor | 0.00ms | 5ms | PASS | regressed |
| memcachedEnvAccessor | 0.00ms | 5ms | PASS | stable |
| keydbEnvAccessor | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| redisEnvAccessor | 492448 B | 0 B | 102400 B | PASS |
| memcachedEnvAccessor | 127016 B | 0 B | 102400 B | PASS |
| keydbEnvAccessor | 126856 B | 0 B | 102400 B | PASS |

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
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +24.55% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +116.02% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +250.06% |
| mean | 0.00ms | 0.00ms | +0.00ms | +115.28% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.02ms | 0.00ms | +0.02ms | +1334.82% |
| total | 0.09ms | 0.04ms | +0.05ms | +115.28% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +49.70% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +25.42% |
| mean | 0.00ms | 0.00ms | +0.00ms | +11.67% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +42.86% |
| total | 0.04ms | 0.03ms | +0.00ms | +11.67% |

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
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +33.60% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -58.20% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -1.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +22.18% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.01ms | +156.82% |
| total | 0.05ms | 0.04ms | +0.01ms | +22.18% |

