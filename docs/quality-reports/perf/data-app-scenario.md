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
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.28ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -21320 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -10056 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | -16048 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -33.97% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -49.89% |
| p99 | 0.03ms | 0.08ms | -0.04ms | -57.05% |
| mean | 0.01ms | 0.02ms | -0.01ms | -39.22% |
| min | 0.01ms | 0.01ms | -0.00ms | -37.40% |
| max | 0.04ms | 0.09ms | -0.05ms | -57.49% |
| total | 0.34ms | 0.57ms | -0.22ms | -39.22% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.09ms |
| mean | 0.05ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.10ms |
| total | 1.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.07ms | -0.02ms | -32.30% |
| p95 | 0.08ms | 0.14ms | -0.06ms | -42.43% |
| p99 | 0.09ms | 0.57ms | -0.48ms | -84.15% |
| mean | 0.05ms | 0.09ms | -0.04ms | -44.27% |
| min | 0.03ms | 0.04ms | -0.01ms | -24.67% |
| max | 0.10ms | 0.75ms | -0.65ms | -87.29% |
| total | 1.55ms | 2.77ms | -1.23ms | -44.27% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.00ms |
| max | 0.09ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.35% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +39.06% |
| p99 | 0.07ms | 0.01ms | +0.06ms | +665.06% |
| mean | 0.01ms | 0.00ms | +0.00ms | +83.13% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.46% |
| max | 0.09ms | 0.01ms | +0.08ms | +888.86% |
| total | 0.20ms | 0.11ms | +0.09ms | +83.13% |

