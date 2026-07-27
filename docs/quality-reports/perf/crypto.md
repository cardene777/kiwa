# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.01ms | 5ms | PASS | stable |
| hashSha256 | 0.00ms | 5ms | PASS | stable |
| aesGcmRoundtrip | 0.02ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.10ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -24712 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -27040 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -16832 B | -23842 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.08ms |
| total | 1.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.61% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -7.96% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -9.92% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.44% |
| min | 0.01ms | 0.01ms | +0.00ms | +1.49% |
| max | 0.08ms | 0.07ms | +0.01ms | +16.45% |
| total | 1.64ms | 1.66ms | -0.02ms | -1.44% |

### hashSha256

# Perf Report — hashSha256.serial

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
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.56% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -5.52% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.51% |
| mean | 0.00ms | 0.00ms | -0.00ms | -1.66% |
| min | 0.00ms | 0.00ms | -0.00ms | -0.04% |
| max | 0.01ms | 0.02ms | -0.00ms | -26.56% |
| total | 0.60ms | 0.61ms | -0.01ms | -1.66% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.16ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -4.53% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -5.74% |
| p99 | 0.03ms | 0.02ms | +0.00ms | +3.72% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.03% |
| min | 0.01ms | 0.01ms | -0.00ms | -3.70% |
| max | 0.16ms | 0.03ms | +0.13ms | +441.77% |
| total | 1.81ms | 1.74ms | +0.07ms | +4.03% |

