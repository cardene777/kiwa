# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 50ms | PASS | stable |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.08ms | 50ms | PASS | stable |
| integrated_workflow (queue + clock combined) | 0.01ms | 50ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.01ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.20ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 937016 B | 0 B | 102400 B | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 2017800 B | 0 B | 102400 B | PASS |
| integrated_workflow (queue + clock combined) | 387688 B | 0 B | 102400 B | PASS |

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
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -16.67% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -14.09% |
| p99 | 0.03ms | 0.04ms | -0.01ms | -28.48% |
| mean | 0.01ms | 0.01ms | -0.00ms | -20.98% |
| min | 0.01ms | 0.01ms | -0.00ms | -13.79% |
| max | 0.03ms | 0.04ms | -0.01ms | -31.46% |
| total | 0.32ms | 0.40ms | -0.08ms | -20.98% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.12ms |
| mean | 0.04ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.13ms |
| total | 1.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.04ms | -0.01ms | -33.01% |
| p95 | 0.08ms | 0.10ms | -0.02ms | -23.83% |
| p99 | 0.12ms | 0.17ms | -0.05ms | -30.75% |
| mean | 0.04ms | 0.06ms | -0.02ms | -35.66% |
| min | 0.03ms | 0.03ms | -0.00ms | -11.47% |
| max | 0.13ms | 0.19ms | -0.06ms | -31.04% |
| total | 1.09ms | 1.70ms | -0.61ms | -35.66% |

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
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -48.46% |
| p95 | 0.01ms | 0.01ms | -0.01ms | -55.89% |
| p99 | 0.01ms | 0.17ms | -0.16ms | -95.44% |
| mean | 0.00ms | 0.01ms | -0.01ms | -75.02% |
| min | 0.00ms | 0.00ms | +0.00ms | +3.69% |
| max | 0.01ms | 0.23ms | -0.22ms | -96.44% |
| total | 0.09ms | 0.36ms | -0.27ms | -75.02% |

