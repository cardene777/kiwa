# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0069ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.06ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0027ms | 0.0083ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.50ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -13752 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 7960 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0069ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0052ms |
| min | 0.0060ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0069ms | 0.01ms | -0.0056ms | -44.82% |
| p50 | 0.0091ms | 0.01ms | -0.0040ms | -30.42% |
| p95 | 0.02ms | 0.02ms | -0.0051ms | -23.03% |
| p99 | 0.03ms | 0.04ms | -0.0078ms | -21.13% |
| mean | 0.01ms | 0.01ms | -0.0043ms | -28.74% |
| min | 0.0060ms | 0.0099ms | -0.0039ms | -39.24% |
| max | 0.03ms | 0.04ms | -0.0088ms | -20.50% |
| total | 0.32ms | 0.45ms | -0.13ms | -28.74% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -29.97% |
| p50 | 0.03ms | 0.04ms | -0.02ms | -34.41% |
| p95 | 0.06ms | 0.08ms | -0.01ms | -18.57% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -25.88% |
| mean | 0.03ms | 0.05ms | -0.02ms | -35.96% |
| min | 0.03ms | 0.03ms | -0.0024ms | -7.95% |
| max | 0.07ms | 0.09ms | -0.02ms | -27.48% |
| total | 1.01ms | 1.58ms | -0.57ms | -35.96% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0029ms |
| p95 | 0.0083ms |
| p99 | 0.06ms |
| mean | 0.0061ms |
| stdev | 0.01ms |
| min | 0.0026ms |
| max | 0.08ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0028ms | -0.00013ms | -4.66% |
| p50 | 0.0029ms | 0.0029ms | -0.000042ms | -1.45% |
| p95 | 0.0083ms | 0.01ms | -0.0033ms | -28.66% |
| p99 | 0.06ms | 0.26ms | -0.19ms | -75.81% |
| mean | 0.0061ms | 0.02ms | -0.0092ms | -60.17% |
| min | 0.0026ms | 0.0027ms | -0.00017ms | -6.07% |
| max | 0.08ms | 0.35ms | -0.27ms | -76.42% |
| total | 0.18ms | 0.46ms | -0.28ms | -60.17% |

