# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| collectRunHistory | 0.03ms | 5ms | PASS | stable |
| detectFlaky | 0.02ms | 5ms | PASS | stable |
| checkThresholds | 0.00ms | 5ms | PASS | stable |
| renderDashboard | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.24ms | 10ms | PASS |
| detectFlaky | 0.46ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 3832 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -24680 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | -216 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.33ms |
| total | 4.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +2.86% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -22.54% |
| p99 | 0.05ms | 0.06ms | -0.00ms | -3.74% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.11% |
| min | 0.02ms | 0.01ms | +0.00ms | +7.78% |
| max | 0.33ms | 0.29ms | +0.04ms | +13.64% |
| total | 4.30ms | 4.39ms | -0.09ms | -2.11% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.19ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.25ms |
| total | 2.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +14.01% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +49.46% |
| p99 | 0.19ms | 0.02ms | +0.17ms | +1005.60% |
| mean | 0.01ms | 0.01ms | +0.01ms | +70.10% |
| min | 0.01ms | 0.00ms | +0.00ms | +11.59% |
| max | 0.25ms | 0.03ms | +0.22ms | +681.80% |
| total | 2.62ms | 1.54ms | +1.08ms | +70.10% |

### checkThresholds

# Perf Report — checkThresholds.serial

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
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +0.46% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +18.33% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.22% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | -0.00ms | -22.87% |
| total | 0.11ms | 0.10ms | +0.01ms | +6.22% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +11.15% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +4.31% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +16.97% |
| mean | 0.00ms | 0.00ms | -0.00ms | -2.24% |
| min | 0.00ms | 0.00ms | +0.00ms | +16.63% |
| max | 0.02ms | 0.02ms | +0.00ms | +27.45% |
| total | 0.68ms | 0.70ms | -0.02ms | -2.24% |

