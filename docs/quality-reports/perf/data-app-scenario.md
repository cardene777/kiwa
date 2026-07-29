# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0061ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.05ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0026ms | 0.0052ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.03ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.20ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -13848 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | -9728 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | 232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0061ms |
| p50 | 0.0090ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0059ms |
| min | 0.0060ms |
| max | 0.04ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.01ms | -0.0064ms | -51.02% |
| p50 | 0.0090ms | 0.01ms | -0.0041ms | -31.37% |
| p95 | 0.02ms | 0.02ms | -0.0052ms | -23.65% |
| p99 | 0.03ms | 0.04ms | -0.0056ms | -15.23% |
| mean | 0.01ms | 0.01ms | -0.0044ms | -29.10% |
| min | 0.0060ms | 0.0099ms | -0.0038ms | -38.82% |
| max | 0.04ms | 0.04ms | -0.0057ms | -13.31% |
| total | 0.32ms | 0.45ms | -0.13ms | -29.10% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.0095ms |
| min | 0.03ms |
| max | 0.07ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -25.50% |
| p50 | 0.03ms | 0.04ms | -0.01ms | -31.37% |
| p95 | 0.05ms | 0.08ms | -0.02ms | -29.33% |
| p99 | 0.07ms | 0.09ms | -0.02ms | -22.58% |
| mean | 0.03ms | 0.05ms | -0.02ms | -35.25% |
| min | 0.03ms | 0.03ms | -0.00063ms | -2.06% |
| max | 0.07ms | 0.09ms | -0.02ms | -23.83% |
| total | 1.03ms | 1.58ms | -0.56ms | -35.25% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0026ms |
| p50 | 0.0027ms |
| p95 | 0.0052ms |
| p99 | 0.0065ms |
| mean | 0.0031ms |
| stdev | 0.00099ms |
| min | 0.0025ms |
| max | 0.0067ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0026ms | 0.0028ms | -0.00021ms | -7.63% |
| p50 | 0.0027ms | 0.0029ms | -0.00023ms | -7.91% |
| p95 | 0.0052ms | 0.01ms | -0.0064ms | -55.11% |
| p99 | 0.0065ms | 0.26ms | -0.25ms | -97.45% |
| mean | 0.0031ms | 0.02ms | -0.01ms | -79.90% |
| min | 0.0025ms | 0.0027ms | -0.00029ms | -10.62% |
| max | 0.0067ms | 0.35ms | -0.35ms | -98.12% |
| total | 0.09ms | 0.46ms | -0.37ms | -79.90% |

