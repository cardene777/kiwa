# Perf Suite — cache

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| redisEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +44281%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| memcachedEnvAccessor | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| keydbEnvAccessor | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +239234%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| redisEnvAccessor | 0.06ms | 10ms | PASS |
| memcachedEnvAccessor | 0.00ms | 10ms | PASS |
| keydbEnvAccessor | 0.00ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| redisEnvAccessor | -3904 B | 0 B | 102400 B | yes | PASS |
| memcachedEnvAccessor | -16200 B | 0 B | 102400 B | yes | PASS |
| keydbEnvAccessor | 8632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### redisEnvAccessor

# Perf Report — redisEnvAccessor.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.19ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +120.67% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +7.90% |
| p99 | 0.03ms | 0.00ms | +0.03ms | +805.84% |
| mean | 0.00ms | 0.00ms | +0.00ms | +511.13% |
| min | 0.00ms | 0.00ms | +0.00ms | +25.30% |
| max | 0.19ms | 0.00ms | +0.18ms | +4717.21% |
| total | 0.41ms | 0.07ms | +0.34ms | +511.13% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -49.85% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -54.57% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -69.53% |
| mean | 0.00ms | 0.00ms | -0.00ms | -56.13% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.01ms | -0.01ms | -79.76% |
| total | 0.04ms | 0.08ms | -0.05ms | -56.13% |

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
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +19.62% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +31.02% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.45% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -1.91% |
| total | 0.05ms | 0.05ms | +0.00ms | +6.45% |

