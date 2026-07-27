# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 50ms | PASS | stable |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.06ms | 50ms | PASS | stable |
| integrated_workflow (queue + clock combined) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.25ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -18520 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -5864 B | 0 B | 102400 B | yes | PASS |
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
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -31.61% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -50.42% |
| p99 | 0.03ms | 0.08ms | -0.04ms | -54.59% |
| mean | 0.01ms | 0.02ms | -0.01ms | -37.66% |
| min | 0.01ms | 0.01ms | -0.00ms | -33.20% |
| max | 0.04ms | 0.09ms | -0.05ms | -54.31% |
| total | 0.35ms | 0.57ms | -0.21ms | -37.66% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.07ms | -0.04ms | -55.87% |
| p95 | 0.06ms | 0.14ms | -0.08ms | -56.20% |
| p99 | 0.07ms | 0.57ms | -0.50ms | -87.22% |
| mean | 0.04ms | 0.09ms | -0.06ms | -60.16% |
| min | 0.03ms | 0.04ms | -0.01ms | -31.38% |
| max | 0.08ms | 0.75ms | -0.67ms | -89.94% |
| total | 1.10ms | 2.77ms | -1.67ms | -60.16% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -6.76% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -12.44% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -14.23% |
| mean | 0.00ms | 0.00ms | -0.00ms | -5.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.81% |
| max | 0.01ms | 0.01ms | -0.00ms | -14.48% |
| total | 0.10ms | 0.11ms | -0.01ms | -5.51% |

