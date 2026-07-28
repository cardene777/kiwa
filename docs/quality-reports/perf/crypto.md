# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.02ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +2836%) 以上の悪化が必要) |
| hashSha256 | 0.03ms | 5ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) |
| aesGcmRoundtrip | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3380%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 0.33ms | 10ms | PASS |
| hashSha256 | 0.18ms | 10ms | PASS |
| aesGcmRoundtrip | 0.17ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -33952 B | -33828 B | 102400 B | yes | PASS |
| hashSha256 | -26808 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17032 B | -27081 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.19ms |
| total | 2.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -5.14% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +38.51% |
| p99 | 0.07ms | 0.02ms | +0.05ms | +205.81% |
| mean | 0.01ms | 0.01ms | +0.00ms | +27.98% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.04% |
| max | 0.19ms | 0.04ms | +0.15ms | +360.81% |
| total | 2.23ms | 1.74ms | +0.49ms | +27.98% |

### hashSha256

# Perf Report — hashSha256.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.41ms |
| total | 1.81ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.57% |
| p95 | 0.03ms | 0.00ms | +0.03ms | +597.71% |
| p99 | 0.07ms | 0.01ms | +0.06ms | +524.24% |
| mean | 0.01ms | 0.00ms | +0.01ms | +189.47% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.19% |
| max | 0.41ms | 0.01ms | +0.39ms | +2610.28% |
| total | 1.81ms | 0.63ms | +1.19ms | +189.47% |

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
| max | 0.03ms |
| total | 1.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -6.46% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.29% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -11.53% |
| mean | 0.01ms | 0.01ms | -0.00ms | -13.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -6.67% |
| max | 0.03ms | 0.11ms | -0.08ms | -76.13% |
| total | 1.48ms | 1.71ms | -0.23ms | -13.48% |

