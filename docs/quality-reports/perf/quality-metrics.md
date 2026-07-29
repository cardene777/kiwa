# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +49281%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +85763%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffReports | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +65041%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -2232 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -15136 B | 0 B | 102400 B | yes | PASS |
| diffReports | -600 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

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
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.17% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +37.37% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -11.47% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.58% |
| min | 0.00ms | 0.00ms | -0.00ms | -16.80% |
| max | 0.02ms | 0.01ms | +0.00ms | +5.63% |
| total | 0.17ms | 0.17ms | +0.01ms | +3.58% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

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
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.40% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +11.18% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.49% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.00ms | 0.00ms | +0.00ms | +118.67% |
| total | 0.10ms | 0.10ms | -0.00ms | -2.49% |

### diffReports

# Perf Report — diffReports.serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -0.81% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +52.56% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.63% |
| min | 0.00ms | 0.00ms | -0.00ms | -8.95% |
| max | 0.02ms | 0.01ms | +0.01ms | +75.81% |
| total | 0.16ms | 0.15ms | +0.02ms | +12.63% |

