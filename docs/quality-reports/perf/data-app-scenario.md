# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0091ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.07ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0029ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.10ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.24ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -17352 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 7672 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 11552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0091ms |
| p50 | 0.0096ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0059ms |
| min | 0.0070ms |
| max | 0.04ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.01ms | -0.0034ms | -27.00% |
| p50 | 0.0096ms | 0.01ms | -0.0035ms | -26.43% |
| p95 | 0.02ms | 0.02ms | -0.0027ms | -12.09% |
| p99 | 0.03ms | 0.04ms | -0.0046ms | -12.40% |
| mean | 0.01ms | 0.01ms | -0.0025ms | -16.47% |
| min | 0.0070ms | 0.0099ms | -0.0029ms | -29.11% |
| max | 0.04ms | 0.04ms | -0.0054ms | -12.54% |
| total | 0.37ms | 0.45ms | -0.07ms | -16.47% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.08ms |
| mean | 0.04ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.08ms |
| total | 1.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0070ms | -17.43% |
| p50 | 0.03ms | 0.04ms | -0.01ms | -24.67% |
| p95 | 0.07ms | 0.08ms | -0.0018ms | -2.41% |
| p99 | 0.08ms | 0.09ms | -0.01ms | -13.69% |
| mean | 0.04ms | 0.05ms | -0.01ms | -23.62% |
| min | 0.03ms | 0.03ms | +0.0025ms | +8.37% |
| max | 0.08ms | 0.09ms | -0.01ms | -15.66% |
| total | 1.21ms | 1.58ms | -0.37ms | -23.62% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0031ms |
| p95 | 0.01ms |
| p99 | 0.07ms |
| mean | 0.0068ms |
| stdev | 0.02ms |
| min | 0.0028ms |
| max | 0.09ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0028ms | +0.000079ms | +2.83% |
| p50 | 0.0031ms | 0.0029ms | +0.00017ms | +5.77% |
| p95 | 0.01ms | 0.01ms | +0.000020ms | +0.17% |
| p99 | 0.07ms | 0.26ms | -0.19ms | -73.93% |
| mean | 0.0068ms | 0.02ms | -0.0084ms | -55.30% |
| min | 0.0028ms | 0.0027ms | +0.000042ms | +1.53% |
| max | 0.09ms | 0.35ms | -0.27ms | -75.04% |
| total | 0.20ms | 0.46ms | -0.25ms | -55.30% |

