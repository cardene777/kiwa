# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0042ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0010ms | 0.0081ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 17864 B | 0 B | 102400 B | yes | PASS |
| runQuery | 18648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0042ms |
| p50 | 0.0048ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0068ms |
| stdev | 0.0040ms |
| min | 0.0041ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0045ms | -0.00029ms | -6.44% |
| p50 | 0.0048ms | 0.0049ms | -0.00015ms | -2.96% |
| p95 | 0.01ms | 0.01ms | +0.0014ms | +10.74% |
| p99 | 0.02ms | 0.02ms | +0.0023ms | +12.75% |
| mean | 0.0068ms | 0.0063ms | +0.00049ms | +7.70% |
| min | 0.0041ms | 0.0044ms | -0.00025ms | -5.71% |
| max | 0.02ms | 0.02ms | +0.0029ms | +14.29% |
| total | 0.27ms | 0.25ms | +0.02ms | +7.70% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0016ms |
| p95 | 0.0081ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0035ms |
| min | 0.00088ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0012ms | -0.00024ms | -19.47% |
| p50 | 0.0016ms | 0.0018ms | -0.00023ms | -12.47% |
| p95 | 0.0081ms | 0.0082ms | -0.000037ms | -0.45% |
| p99 | 0.02ms | 0.01ms | +0.0060ms | +59.73% |
| mean | 0.0028ms | 0.0025ms | +0.00031ms | +12.35% |
| min | 0.00088ms | 0.0012ms | -0.00029ms | -25.02% |
| max | 0.02ms | 0.01ms | +0.0099ms | +90.12% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.35% |

