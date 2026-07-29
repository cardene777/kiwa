# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0063ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.07ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0027ms | 0.0076ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.24ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -16552 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -16232 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 616 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0063ms |
| p50 | 0.0091ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0059ms |
| min | 0.0061ms |
| max | 0.04ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0063ms | 0.01ms | -0.0062ms | -49.68% |
| p50 | 0.0091ms | 0.01ms | -0.0040ms | -30.26% |
| p95 | 0.02ms | 0.02ms | -0.0049ms | -22.23% |
| p99 | 0.03ms | 0.04ms | -0.0054ms | -14.52% |
| mean | 0.01ms | 0.01ms | -0.0041ms | -27.19% |
| min | 0.0061ms | 0.0099ms | -0.0038ms | -38.40% |
| max | 0.04ms | 0.04ms | -0.0055ms | -12.93% |
| total | 0.33ms | 0.45ms | -0.12ms | -27.19% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.04ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -26.25% |
| p50 | 0.04ms | 0.04ms | -0.0080ms | -17.93% |
| p95 | 0.07ms | 0.08ms | -0.01ms | -13.50% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -23.67% |
| mean | 0.04ms | 0.05ms | -0.01ms | -26.10% |
| min | 0.03ms | 0.03ms | -0.0017ms | -5.62% |
| max | 0.07ms | 0.09ms | -0.02ms | -25.59% |
| total | 1.17ms | 1.58ms | -0.41ms | -26.10% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0076ms |
| p99 | 0.08ms |
| mean | 0.0069ms |
| stdev | 0.02ms |
| min | 0.0026ms |
| max | 0.11ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0028ms | -0.00013ms | -4.51% |
| p50 | 0.0027ms | 0.0029ms | -0.00015ms | -5.04% |
| p95 | 0.0076ms | 0.01ms | -0.0041ms | -35.09% |
| p99 | 0.08ms | 0.26ms | -0.18ms | -69.33% |
| mean | 0.0069ms | 0.02ms | -0.0084ms | -54.82% |
| min | 0.0026ms | 0.0027ms | -0.00012ms | -4.55% |
| max | 0.11ms | 0.35ms | -0.25ms | -69.70% |
| total | 0.21ms | 0.46ms | -0.25ms | -54.82% |

