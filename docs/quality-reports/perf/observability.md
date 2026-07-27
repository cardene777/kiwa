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
| collectRunHistory | 0.21ms | 10ms | PASS |
| detectFlaky | 0.10ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 2424 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | 832 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | -608 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | -3248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.32ms |
| total | 4.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.82% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -19.58% |
| p99 | 0.08ms | 0.06ms | +0.02ms | +43.01% |
| mean | 0.02ms | 0.02ms | +0.00ms | +7.61% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.39% |
| max | 0.32ms | 0.29ms | +0.03ms | +11.84% |
| total | 4.72ms | 4.39ms | +0.33ms | +7.61% |

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
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +27.14% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +20.94% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +22.37% |
| mean | 0.01ms | 0.01ms | +0.00ms | +28.25% |
| min | 0.01ms | 0.00ms | +0.00ms | +30.34% |
| max | 0.03ms | 0.03ms | +0.00ms | +7.26% |
| total | 1.97ms | 1.54ms | +0.43ms | +28.25% |

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
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +20.19% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +12.92% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +4.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +24.59% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.20% |
| max | 0.02ms | 0.01ms | +0.01ms | +76.68% |
| total | 0.13ms | 0.10ms | +0.02ms | +24.59% |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.06ms |
| total | 0.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +15.57% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.65% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +41.49% |
| mean | 0.00ms | 0.00ms | +0.00ms | +23.02% |
| min | 0.00ms | 0.00ms | +0.00ms | +14.29% |
| max | 0.06ms | 0.02ms | +0.05ms | +278.84% |
| total | 0.86ms | 0.70ms | +0.16ms | +23.02% |

