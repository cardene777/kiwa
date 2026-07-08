# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildCspHeader | 0.01ms | 5ms | PASS | n/a (baseline seeded) |
| validateNonce | 0.00ms | 5ms | PASS | n/a (baseline seeded) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.05ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| buildCspHeader | 2815400 B | 0 B | 102400 B | PASS |
| validateNonce | 138096 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 1.05ms |

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
| max | 0.02ms |
| total | 0.08ms |

