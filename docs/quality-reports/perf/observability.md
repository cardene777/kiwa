# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| collectRunHistory | 0.03ms | 5ms | PASS | regressed |
| detectFlaky | 0.02ms | 5ms | PASS | regressed |
| checkThresholds | 0.00ms | 5ms | PASS | stable |
| renderDashboard | 0.01ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.47ms | 10ms | PASS |
| detectFlaky | 0.07ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| collectRunHistory | 4054160 B | 0 B | 102400 B | PASS |
| detectFlaky | 3311016 B | 0 B | 102400 B | PASS |
| checkThresholds | 208464 B | 0 B | 102400 B | PASS |
| renderDashboard | 450384 B | 0 B | 102400 B | PASS |

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
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.41ms |
| total | 5.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +26.84% |
| p95 | 0.03ms | 0.03ms | +0.01ms | +21.85% |
| p99 | 0.06ms | 0.04ms | +0.02ms | +38.29% |
| mean | 0.03ms | 0.02ms | +0.01ms | +28.81% |
| min | 0.02ms | 0.02ms | +0.00ms | +0.80% |
| max | 0.41ms | 0.22ms | +0.19ms | +88.96% |
| total | 5.18ms | 4.02ms | +1.16ms | +28.81% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 1.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +12.70% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +26.26% |
| p99 | 0.03ms | 0.02ms | +0.00ms | +10.32% |
| mean | 0.01ms | 0.01ms | +0.00ms | +15.47% |
| min | 0.01ms | 0.01ms | +0.00ms | +8.20% |
| max | 0.04ms | 0.03ms | +0.01ms | +44.70% |
| total | 1.77ms | 1.53ms | +0.24ms | +15.47% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.83% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +13.28% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -45.62% |
| mean | 0.00ms | 0.00ms | +0.00ms | +6.32% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +30.22% |
| total | 0.11ms | 0.10ms | +0.01ms | +6.32% |

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
| total | 0.71ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +9.62% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +32.97% |
| mean | 0.00ms | 0.00ms | +0.00ms | +20.93% |
| min | 0.00ms | 0.00ms | +0.00ms | +2.19% |
| max | 0.02ms | 0.01ms | +0.00ms | +15.25% |
| total | 0.71ms | 0.59ms | +0.12ms | +20.93% |

