# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.02ms | 5ms | PASS | stable |
| hashSha256 | 0.00ms | 5ms | PASS | stable |
| aesGcmRoundtrip | 0.02ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.08ms | 10ms | PASS |
| hashSha256 | 0.03ms | 10ms | PASS |
| aesGcmRoundtrip | 0.17ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -186160 B | 5888 B | 102400 B | yes | PASS |
| hashSha256 | -11368 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17032 B | -19042 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 1.78ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.41% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -0.84% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +30.65% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.02% |
| min | 0.01ms | 0.01ms | +0.00ms | +5.96% |
| max | 0.09ms | 0.07ms | +0.02ms | +35.84% |
| total | 1.78ms | 1.66ms | +0.12ms | +7.02% |

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
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.60% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -5.81% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -25.62% |
| mean | 0.00ms | 0.00ms | -0.00ms | -4.00% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.74% |
| max | 0.01ms | 0.02ms | -0.00ms | -19.51% |
| total | 0.58ms | 0.61ms | -0.02ms | -4.00% |

### aesGcmRoundtrip

# Perf Report — aesGcmRoundtrip.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 1.93ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.78% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -5.09% |
| p99 | 0.08ms | 0.02ms | +0.05ms | +215.14% |
| mean | 0.01ms | 0.01ms | +0.00ms | +11.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -7.38% |
| max | 0.12ms | 0.03ms | +0.09ms | +293.30% |
| total | 1.93ms | 1.74ms | +0.20ms | +11.48% |

