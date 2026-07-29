# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.05ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +1636%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.08ms | 50ms | PASS | stable (差 0.11ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.01ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +7231%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.10ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.69ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.17ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -20640 B | -9959 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 2280 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | -2608 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.11ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.13ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +16.08% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +58.71% |
| p99 | 0.11ms | 0.10ms | +0.01ms | +11.65% |
| mean | 0.02ms | 0.02ms | +0.00ms | +12.54% |
| min | 0.01ms | 0.01ms | -0.01ms | -46.96% |
| max | 0.13ms | 0.12ms | +0.01ms | +9.41% |
| total | 0.65ms | 0.58ms | +0.07ms | +12.54% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.08ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.10ms | -0.05ms | -49.11% |
| p95 | 0.08ms | 0.18ms | -0.11ms | -57.95% |
| p99 | 0.08ms | 0.83ms | -0.75ms | -90.45% |
| mean | 0.06ms | 0.14ms | -0.08ms | -58.32% |
| min | 0.03ms | 0.04ms | -0.01ms | -25.64% |
| max | 0.08ms | 1.10ms | -1.01ms | -92.63% |
| total | 1.70ms | 4.08ms | -2.38ms | -58.32% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 2.36ms |
| mean | 0.11ms |
| stdev | 0.61ms |
| min | 0.00ms |
| max | 3.32ms |
| total | 3.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +17.16% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +57.19% |
| p99 | 2.36ms | 0.01ms | +2.35ms | +26459.38% |
| mean | 0.11ms | 0.00ms | +0.11ms | +3276.88% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.17% |
| max | 3.32ms | 0.01ms | +3.31ms | +36118.68% |
| total | 3.44ms | 0.10ms | +3.34ms | +3276.88% |

