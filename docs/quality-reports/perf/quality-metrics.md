# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +49281%) 以上の悪化が必要) |
| evaluateReleaseGate_11axis | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +85763%) 以上の悪化が必要) |
| diffReports | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +65041%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -8384 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -4240 B | 0 B | 102400 B | yes | PASS |
| diffReports | 23208 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.28ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +71.53% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +89.14% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +7.60% |
| mean | 0.00ms | 0.00ms | +0.00ms | +70.25% |
| min | 0.00ms | 0.00ms | +0.00ms | +83.20% |
| max | 0.02ms | 0.01ms | +0.01ms | +67.88% |
| total | 0.28ms | 0.17ms | +0.12ms | +70.25% |

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
| p50 | 0.00ms | 0.00ms | -0.00ms | -8.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.03% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -3.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -9.17% |
| max | 0.00ms | 0.00ms | +0.00ms | +90.55% |
| total | 0.10ms | 0.10ms | -0.00ms | -0.96% |

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
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.92% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +29.13% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.08% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.53% |
| total | 0.15ms | 0.15ms | +0.01ms | +6.08% |

