# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00ms | 5ms | PASS | stable |
| evaluateReleaseGate_11axis | 0.00ms | 5ms | PASS | stable |
| diffReports | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -3384 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -16168 B | 0 B | 102400 B | yes | PASS |
| diffReports | 7464 B | 0 B | 102400 B | yes | PASS |

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
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.18% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +34.40% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +11.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.47% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -16.46% |
| total | 0.16ms | 0.15ms | +0.01ms | +3.47% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.93% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +38.21% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.15% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +96.61% |
| total | 0.09ms | 0.09ms | +0.00ms | +1.15% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +36.46% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +23.46% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +146.19% |
| mean | 0.00ms | 0.00ms | +0.00ms | +68.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +55.47% |
| max | 0.02ms | 0.01ms | +0.01ms | +73.10% |
| total | 0.23ms | 0.14ms | +0.10ms | +68.93% |

