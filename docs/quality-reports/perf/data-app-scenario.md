# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 50ms | PASS | stable |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.07ms | 50ms | PASS | stable |
| integrated_workflow (queue + clock combined) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.23ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -20104 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -4800 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | -16296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -26.29% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -53.64% |
| p99 | 0.03ms | 0.08ms | -0.05ms | -60.99% |
| mean | 0.01ms | 0.02ms | -0.01ms | -36.96% |
| min | 0.01ms | 0.01ms | -0.00ms | -36.98% |
| max | 0.03ms | 0.09ms | -0.05ms | -61.28% |
| total | 0.36ms | 0.57ms | -0.21ms | -36.96% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.07ms | -0.04ms | -52.64% |
| p95 | 0.07ms | 0.14ms | -0.07ms | -49.28% |
| p99 | 0.08ms | 0.57ms | -0.50ms | -86.87% |
| mean | 0.04ms | 0.09ms | -0.05ms | -54.72% |
| min | 0.03ms | 0.04ms | -0.01ms | -32.50% |
| max | 0.08ms | 0.75ms | -0.67ms | -89.69% |
| total | 1.26ms | 2.77ms | -1.52ms | -54.72% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.06ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.08ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -12.18% |
| p95 | 0.01ms | 0.01ms | +0.01ms | +86.34% |
| p99 | 0.06ms | 0.01ms | +0.05ms | +611.17% |
| mean | 0.01ms | 0.00ms | +0.00ms | +68.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -13.04% |
| max | 0.08ms | 0.01ms | +0.07ms | +780.44% |
| total | 0.18ms | 0.11ms | +0.07ms | +68.13% |

