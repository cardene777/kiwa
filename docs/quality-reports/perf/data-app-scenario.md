# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.01ms | 0.02ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.19ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0029ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.04ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.54ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 1.54ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -576 B | -10019 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 13216 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0050ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0021ms | -16.47% |
| p50 | 0.01ms | 0.01ms | +0.00063ms | +4.78% |
| p95 | 0.02ms | 0.02ms | -0.0015ms | -6.74% |
| p99 | 0.03ms | 0.04ms | -0.0040ms | -10.88% |
| mean | 0.01ms | 0.01ms | -0.00026ms | -1.72% |
| min | 0.01ms | 0.0099ms | +0.00025ms | +2.53% |
| max | 0.04ms | 0.04ms | -0.0053ms | -12.44% |
| total | 0.44ms | 0.45ms | -0.0077ms | -1.72% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.05ms |
| p95 | 0.19ms |
| p99 | 0.26ms |
| mean | 0.07ms |
| stdev | 0.06ms |
| min | 0.03ms |
| max | 0.28ms |
| total | 2.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -25.35% |
| p50 | 0.05ms | 0.04ms | +0.0013ms | +2.86% |
| p95 | 0.19ms | 0.08ms | +0.12ms | +152.80% |
| p99 | 0.26ms | 0.09ms | +0.17ms | +191.21% |
| mean | 0.07ms | 0.05ms | +0.02ms | +41.74% |
| min | 0.03ms | 0.03ms | -0.0015ms | -5.07% |
| max | 0.28ms | 0.09ms | +0.19ms | +206.93% |
| total | 2.25ms | 1.58ms | +0.66ms | +41.74% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0032ms |
| p95 | 0.01ms |
| p99 | 0.48ms |
| mean | 0.03ms |
| stdev | 0.12ms |
| min | 0.0027ms |
| max | 0.68ms |
| total | 0.80ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0028ms | +0.000075ms | +2.68% |
| p50 | 0.0032ms | 0.0029ms | +0.00033ms | +11.52% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -9.27% |
| p99 | 0.48ms | 0.26ms | +0.23ms | +88.83% |
| mean | 0.03ms | 0.02ms | +0.01ms | +73.53% |
| min | 0.0027ms | 0.0027ms | 0.00ms | 0.00% |
| max | 0.68ms | 0.35ms | +0.32ms | +90.89% |
| total | 0.80ms | 0.46ms | +0.34ms | +73.53% |

