# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +1636%) 以上の悪化が必要) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.07ms | 50ms | PASS | stable (差 0.11ms が下限 0.5ms 未満で判定を保留) |
| integrated_workflow (queue + clock combined) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +7231%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 1.40ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 3.31ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -21776 B | -9975 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 7848 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 520 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -19.28% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +14.13% |
| p99 | 0.05ms | 0.10ms | -0.05ms | -53.01% |
| mean | 0.02ms | 0.02ms | -0.00ms | -20.48% |
| min | 0.01ms | 0.01ms | -0.01ms | -41.21% |
| max | 0.05ms | 0.12ms | -0.07ms | -59.42% |
| total | 0.46ms | 0.58ms | -0.12ms | -20.48% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.69ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.10ms | -0.04ms | -44.77% |
| p95 | 0.07ms | 0.18ms | -0.11ms | -61.99% |
| p99 | 0.07ms | 0.83ms | -0.76ms | -91.51% |
| mean | 0.06ms | 0.14ms | -0.08ms | -58.70% |
| min | 0.04ms | 0.04ms | -0.01ms | -12.01% |
| max | 0.07ms | 1.10ms | -1.02ms | -93.50% |
| total | 1.69ms | 4.08ms | -2.40ms | -58.70% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.25ms |
| mean | 0.02ms |
| stdev | 0.06ms |
| min | 0.00ms |
| max | 0.35ms |
| total | 0.45ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.24% |
| p99 | 0.25ms | 0.01ms | +0.24ms | +2716.87% |
| mean | 0.02ms | 0.00ms | +0.01ms | +341.70% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.06% |
| max | 0.35ms | 0.01ms | +0.34ms | +3707.13% |
| total | 0.45ms | 0.10ms | +0.35ms | +341.70% |

