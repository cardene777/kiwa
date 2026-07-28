# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildCspHeader | 0.01ms | 5ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |
| validateNonce | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.07ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | 3056 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -18096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.01ms | -59.80% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -70.23% |
| p99 | 0.01ms | 0.09ms | -0.07ms | -84.14% |
| mean | 0.01ms | 0.02ms | -0.01ms | -63.53% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.46% |
| max | 0.02ms | 0.13ms | -0.11ms | -86.07% |
| total | 1.14ms | 3.13ms | -1.99ms | -63.53% |

### validateNonce

# Perf Report — validateNonce.serial

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -61.44% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -71.90% |
| p99 | 0.00ms | 0.05ms | -0.05ms | -96.75% |
| mean | 0.00ms | 0.00ms | -0.00ms | -84.57% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.11ms | -0.10ms | -96.11% |
| total | 0.05ms | 0.35ms | -0.30ms | -84.57% |

