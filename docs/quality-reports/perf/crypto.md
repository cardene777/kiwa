# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.02ms | 5ms | PASS | stable |
| hashSha256 | 0.00ms | 5ms | PASS | stable |
| aesGcmRoundtrip | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.08ms | 10ms | PASS |
| hashSha256 | 0.03ms | 10ms | PASS |
| aesGcmRoundtrip | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -24392 B | 0 B | 102400 B | yes | PASS |
| hashSha256 | -27040 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -18776 B | -23219 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 1.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.00% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -4.35% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -13.23% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.62% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.46% |
| max | 0.09ms | 0.07ms | +0.03ms | +39.27% |
| total | 1.62ms | 1.66ms | -0.04ms | -2.62% |

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
| total | 0.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.92% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -12.95% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -29.55% |
| mean | 0.00ms | 0.00ms | -0.00ms | -10.22% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.65% |
| max | 0.01ms | 0.02ms | -0.01ms | -34.15% |
| total | 0.54ms | 0.61ms | -0.06ms | -10.22% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

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
| max | 0.12ms |
| total | 1.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.41% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -20.25% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.13% |
| mean | 0.01ms | 0.01ms | -0.00ms | -9.72% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.72% |
| max | 0.12ms | 0.03ms | +0.09ms | +292.88% |
| total | 1.57ms | 1.74ms | -0.17ms | -9.72% |

