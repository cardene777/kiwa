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
| evaluateReleaseGate_7axis | -7720 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | -14856 B | 0 B | 102400 B | yes | PASS |
| diffReports | 7000 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.18% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -10.49% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -10.68% |
| mean | 0.00ms | 0.00ms | +0.00ms | +4.26% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.21% |
| total | 0.16ms | 0.15ms | +0.01ms | +4.26% |

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
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.45% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +9.69% |
| mean | 0.00ms | 0.00ms | +0.00ms | +0.82% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +62.09% |
| total | 0.09ms | 0.09ms | +0.00ms | +0.82% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +4.06% |
| p99 | 0.01ms | 0.01ms | +0.01ms | +108.86% |
| mean | 0.00ms | 0.00ms | +0.00ms | +79.00% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.09ms | 0.01ms | +0.08ms | +624.29% |
| total | 0.25ms | 0.14ms | +0.11ms | +79.00% |

