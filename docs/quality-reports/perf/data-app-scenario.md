# Perf Suite — data-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.0062ms | 0.02ms | 50ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.03ms | 0.10ms | 50ms | 0.00042ms | PASS | stable (p10 -23% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| integrated_workflow (queue + clock combined) | 0.0027ms | 0.0081ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 8 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | 0.02ms | 100ms | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 0.29ms | 100ms | PASS |
| integrated_workflow (queue + clock combined) | 0.02ms | 100ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| queue_burst (setup + 50 send + 50 receive) | -14728 B | 0 B | 102400 B | yes | PASS |
| cron_scheduling (10 schedule + advanceMs 5 turn) | 616 B | 0 B | 102400 B | yes | PASS |
| integrated_workflow (queue + clock combined) | -3456 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### queue_burst (setup + 50 send + 50 receive)

# Perf Report — queue_burst (setup + 50 send + 50 receive).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0062ms |
| p50 | 0.0093ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0061ms |
| min | 0.0061ms |
| max | 0.04ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.01ms | -0.0063ms | -50.31% |
| p50 | 0.0093ms | 0.01ms | -0.0038ms | -28.98% |
| p95 | 0.02ms | 0.02ms | -0.0041ms | -18.62% |
| p99 | 0.03ms | 0.04ms | -0.0049ms | -13.33% |
| mean | 0.01ms | 0.01ms | -0.0038ms | -25.15% |
| min | 0.0061ms | 0.0099ms | -0.0037ms | -37.97% |
| max | 0.04ms | 0.04ms | -0.0054ms | -12.63% |
| total | 0.34ms | 0.45ms | -0.11ms | -25.15% |

### cron_scheduling (10 schedule + advanceMs 5 turn)

# Perf Report — cron_scheduling (10 schedule + advanceMs 5 turn).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.03ms |
| p50 | 0.07ms |
| p95 | 0.10ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.03ms |
| max | 0.11ms |
| total | 1.85ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.0092ms | -22.81% |
| p50 | 0.07ms | 0.04ms | +0.02ms | +53.00% |
| p95 | 0.10ms | 0.08ms | +0.02ms | +27.82% |
| p99 | 0.11ms | 0.09ms | +0.02ms | +22.75% |
| mean | 0.06ms | 0.05ms | +0.0087ms | +16.49% |
| min | 0.03ms | 0.03ms | +0.00033ms | +1.10% |
| max | 0.11ms | 0.09ms | +0.02ms | +23.46% |
| total | 1.85ms | 1.58ms | +0.26ms | +16.49% |

### integrated_workflow (queue + clock combined)

# Perf Report — integrated_workflow (queue + clock combined).serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 5 |
| p10 | 0.0027ms |
| p50 | 0.0027ms |
| p95 | 0.0081ms |
| p99 | 0.08ms |
| mean | 0.0070ms |
| stdev | 0.02ms |
| min | 0.0026ms |
| max | 0.12ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0027ms | 0.0028ms | -0.00013ms | -4.63% |
| p50 | 0.0027ms | 0.0029ms | -0.00015ms | -5.04% |
| p95 | 0.0081ms | 0.01ms | -0.0036ms | -30.53% |
| p99 | 0.08ms | 0.26ms | -0.17ms | -67.14% |
| mean | 0.0070ms | 0.02ms | -0.0083ms | -54.10% |
| min | 0.0026ms | 0.0027ms | -0.00012ms | -4.55% |
| max | 0.12ms | 0.35ms | -0.24ms | -67.54% |
| total | 0.21ms | 0.46ms | -0.25ms | -54.10% |

