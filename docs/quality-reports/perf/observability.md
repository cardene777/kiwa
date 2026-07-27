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
| collectRunHistory | 0.23ms | 10ms | PASS |
| detectFlaky | 0.06ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.04ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 3656 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -8416 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | -14536 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | -480 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.30ms |
| total | 4.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +1.91% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -20.58% |
| p99 | 0.06ms | 0.06ms | +0.00ms | +5.16% |
| mean | 0.02ms | 0.02ms | -0.00ms | -2.76% |
| min | 0.02ms | 0.01ms | +0.00ms | +0.28% |
| max | 0.30ms | 0.29ms | +0.01ms | +3.44% |
| total | 4.27ms | 4.39ms | -0.12ms | -2.76% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +8.48% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +0.72% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +16.15% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.95% |
| min | 0.01ms | 0.00ms | +0.00ms | +10.71% |
| max | 0.03ms | 0.03ms | -0.01ms | -17.94% |
| total | 1.52ms | 1.54ms | -0.01ms | -0.95% |

### checkThresholds

# Perf Report — checkThresholds.serial

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
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +8.18% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +80.17% |
| mean | 0.00ms | 0.00ms | +0.00ms | +12.91% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +25.55% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.91% |

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
| total | 0.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +137.76% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -5.30% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +8.32% |
| mean | 0.00ms | 0.00ms | +0.00ms | +21.37% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.34% |
| max | 0.02ms | 0.02ms | +0.00ms | +2.52% |
| total | 0.85ms | 0.70ms | +0.15ms | +21.37% |

