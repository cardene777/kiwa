# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| redisEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +44281%) 以上の悪化が必要) |
| memcachedEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |
| keydbEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.01ms | 10ms | PASS |
| memcachedEnvAccessor | 0.01ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -10680 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16368 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 3576 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -9.86% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -70.24% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -28.33% |
| mean | 0.00ms | 0.00ms | -0.00ms | -22.24% |
| min | 0.00ms | 0.00ms | -0.00ms | -24.70% |
| max | 0.00ms | 0.00ms | -0.00ms | -19.35% |
| total | 0.05ms | 0.07ms | -0.01ms | -22.24% |

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
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -62.46% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -63.54% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -75.29% |
| mean | 0.00ms | 0.00ms | -0.00ms | -63.02% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.01ms | -0.01ms | -93.26% |
| total | 0.03ms | 0.08ms | -0.05ms | -63.02% |

### keydbEnvAccessor

# Perf Report — keydbEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.03ms |
| stdev | 0.30ms |
| min | 0.00ms |
| max | 4.05ms |
| total | 5.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +80.41% |
| p99 | 0.02ms | 0.00ms | +0.02ms | +2575.42% |
| mean | 0.03ms | 0.00ms | +0.03ms | +12093.76% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 4.05ms | 0.01ms | +4.04ms | +37111.88% |
| total | 5.58ms | 0.05ms | +5.54ms | +12093.76% |

