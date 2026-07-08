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
| detectFlaky | 0.07ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| collectRunHistory | 4108712 B | 0 B | 102400 B | PASS |
| detectFlaky | 2570480 B | 0 B | 102400 B | PASS |
| checkThresholds | -246464 B | 0 B | 102400 B | PASS |
| renderDashboard | 450400 B | 0 B | 102400 B | PASS |

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
| min | 0.01ms |
| max | 0.32ms |
| total | 4.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | -0.00ms | -1.43% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +8.00% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +12.38% |
| mean | 0.02ms | 0.02ms | +0.00ms | +3.29% |
| min | 0.01ms | 0.02ms | -0.00ms | -5.34% |
| max | 0.32ms | 0.22ms | +0.10ms | +47.83% |
| total | 4.15ms | 4.02ms | +0.13ms | +3.29% |

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
| max | 0.14ms |
| total | 1.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +12.70% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +17.32% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +25.26% |
| mean | 0.01ms | 0.01ms | +0.00ms | +22.66% |
| min | 0.01ms | 0.01ms | +0.00ms | +10.66% |
| max | 0.14ms | 0.03ms | +0.11ms | +422.89% |
| total | 1.88ms | 1.53ms | +0.35ms | +22.66% |

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
| p95 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -41.75% |
| mean | 0.00ms | 0.00ms | +0.00ms | +3.39% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.35% |
| total | 0.11ms | 0.10ms | +0.00ms | +3.39% |

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
| max | 0.11ms |
| total | 0.75ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +6.25% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +12.18% |
| p99 | 0.02ms | 0.01ms | +0.00ms | +34.41% |
| mean | 0.00ms | 0.00ms | +0.00ms | +27.91% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.67% |
| max | 0.11ms | 0.01ms | +0.09ms | +647.23% |
| total | 0.75ms | 0.59ms | +0.16ms | +27.91% |

