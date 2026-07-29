# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0061ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.07ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0030ms | 0.010ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.23ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -21344 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -9728 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0088ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0060ms |
| max | 0.06ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.01ms | -0.0064ms | -51.32% |
| p50 | 0.0088ms | 0.01ms | -0.0043ms | -32.64% |
| p95 | 0.02ms | 0.02ms | -0.00071ms | -3.22% |
| p99 | 0.05ms | 0.04ms | +0.01ms | +37.00% |
| mean | 0.01ms | 0.01ms | -0.0034ms | -22.61% |
| min | 0.0060ms | 0.0099ms | -0.0039ms | -39.67% |
| max | 0.06ms | 0.04ms | +0.02ms | +43.25% |
| total | 0.35ms | 0.45ms | -0.10ms | -22.61% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -29.55% |
| p50 | 0.03ms | 0.04ms | -0.02ms | -34.60% |
| p95 | 0.07ms | 0.08ms | -0.0085ms | -11.09% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -19.72% |
| mean | 0.03ms | 0.05ms | -0.02ms | -33.88% |
| min | 0.03ms | 0.03ms | -0.0022ms | -7.13% |
| max | 0.07ms | 0.09ms | -0.02ms | -21.71% |
| total | 1.05ms | 1.58ms | -0.54ms | -33.88% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0035ms |
| p95 | 0.010ms |
| p99 | 0.07ms |
| mean | 0.0073ms |
| stdev | 0.02ms |
| min | 0.0025ms |
| max | 0.09ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0028ms | +0.00022ms | +8.06% |
| p50 | 0.0035ms | 0.0029ms | +0.00058ms | +20.15% |
| p95 | 0.010ms | 0.01ms | -0.0017ms | -14.70% |
| p99 | 0.07ms | 0.26ms | -0.19ms | -72.90% |
| mean | 0.0073ms | 0.02ms | -0.0079ms | -51.94% |
| min | 0.0025ms | 0.0027ms | -0.00025ms | -9.09% |
| max | 0.09ms | 0.35ms | -0.26ms | -73.65% |
| total | 0.22ms | 0.46ms | -0.24ms | -51.94% |

