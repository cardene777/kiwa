# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| buildCspHeader | 0.01ms | 5ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| validateNonce | 0.00ms | 5ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.12ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | 95032 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -16408 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 1.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.01ms | -54.08% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -69.07% |
| p99 | 0.02ms | 0.09ms | -0.07ms | -80.41% |
| mean | 0.01ms | 0.02ms | -0.01ms | -60.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +24.12% |
| max | 0.03ms | 0.13ms | -0.10ms | -77.62% |
| total | 1.24ms | 3.13ms | -1.89ms | -60.34% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -53.87% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -67.17% |
| p99 | 0.00ms | 0.05ms | -0.05ms | -96.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -83.03% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.00ms | 0.11ms | -0.10ms | -96.26% |
| total | 0.06ms | 0.35ms | -0.29ms | -83.03% |

