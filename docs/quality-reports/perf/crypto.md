# Perf Suite — crypto

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| signAndVerifyJWT | 0.02ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +2836%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| hashSha256 | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10152%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| aesGcmRoundtrip | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +3380%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| signAndVerifyJWT | 1.15ms | 10ms | PASS |
| hashSha256 | 0.04ms | 10ms | PASS |
| aesGcmRoundtrip | 0.24ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| signAndVerifyJWT | -26240 B | 29184 B | 102400 B | yes | PASS |
| hashSha256 | -17520 B | 0 B | 102400 B | yes | PASS |
| aesGcmRoundtrip | -17128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### signAndVerifyJWT

# Perf Report — signAndVerifyJWT.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.35ms |
| mean | 0.03ms |
| stdev | 0.17ms |
| min | 0.01ms |
| max | 2.29ms |
| total | 5.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +25.72% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +36.46% |
| p99 | 0.35ms | 0.02ms | +0.33ms | +1360.50% |
| mean | 0.03ms | 0.01ms | +0.02ms | +215.65% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 2.29ms | 0.04ms | +2.25ms | +5346.73% |
| total | 5.50ms | 1.74ms | +3.76ms | +215.65% |

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
| max | 0.02ms |
| total | 0.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.08% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -4.17% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +1.70% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.98% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.27% |
| max | 0.02ms | 0.01ms | +0.00ms | +4.72% |
| total | 0.63ms | 0.63ms | +0.01ms | +0.98% |

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
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.35ms |
| total | 1.95ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.77% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -1.95% |
| p99 | 0.02ms | 0.03ms | -0.00ms | -18.51% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.38% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.67% |
| max | 0.35ms | 0.11ms | +0.24ms | +223.60% |
| total | 1.95ms | 1.71ms | +0.25ms | +14.38% |

