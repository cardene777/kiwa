# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.01ms | 5ms | PASS | improved |
| hashSha256 | 0.00ms | 5ms | PASS | stable |
| aesGcmRoundtrip | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.09ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| signAndVerifyJWT | 1082704 B | 29184 B | 102400 B | PASS |
| hashSha256 | 338416 B | 8192 B | 102400 B | PASS |
| aesGcmRoundtrip | 739200 B | 18192 B | 102400 B | PASS |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -12.23% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -35.65% |
| p99 | 0.02ms | 0.06ms | -0.04ms | -67.19% |
| mean | 0.01ms | 0.01ms | -0.00ms | -25.58% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.55% |
| max | 0.03ms | 0.11ms | -0.08ms | -76.57% |
| total | 1.52ms | 2.04ms | -0.52ms | -25.58% |

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
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -11.12% |
| p95 | 0.00ms | 0.01ms | -0.00ms | -13.06% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +0.81% |
| mean | 0.00ms | 0.00ms | -0.00ms | -12.81% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.55% |
| max | 0.01ms | 0.01ms | +0.00ms | +4.04% |
| total | 0.53ms | 0.61ms | -0.08ms | -12.81% |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 1.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -14.72% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -14.81% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.08% |
| mean | 0.01ms | 0.01ms | -0.00ms | -15.63% |
| min | 0.01ms | 0.01ms | -0.00ms | -16.78% |
| max | 0.05ms | 0.02ms | +0.03ms | +102.83% |
| total | 1.40ms | 1.66ms | -0.26ms | -15.63% |

