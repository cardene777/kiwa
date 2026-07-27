# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildCspHeader | 0.01ms | 5ms | PASS | stable |
| validateNonce | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.05ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | 1232 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -3640 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.02ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.01ms | -0.00ms | -0.82% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +10.22% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +4.08% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.30% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00ms | +2.44% |
| total | 1.06ms | 1.06ms | +0.00ms | +0.30% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.84% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +13.43% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.07% |
| min | 0.00ms | 0.00ms | -0.00ms | -19.71% |
| max | 0.00ms | 0.00ms | +0.00ms | +33.35% |
| total | 0.05ms | 0.05ms | +0.00ms | +9.07% |

