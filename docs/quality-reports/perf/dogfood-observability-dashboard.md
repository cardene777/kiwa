# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0047ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0011ms | 0.0062ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 11000 B | 0 B | 102400 B | yes | PASS |
| runQuery | 40040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0048ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0065ms |
| stdev | 0.0030ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0045ms | +0.00021ms | +4.67% |
| p50 | 0.0048ms | 0.0049ms | -0.000083ms | -1.68% |
| p95 | 0.01ms | 0.01ms | -0.0015ms | -11.66% |
| p99 | 0.02ms | 0.02ms | -0.0017ms | -9.78% |
| mean | 0.0065ms | 0.0063ms | +0.00010ms | +1.64% |
| min | 0.0043ms | 0.0044ms | -0.00013ms | -2.86% |
| max | 0.02ms | 0.02ms | -0.0015ms | -7.45% |
| total | 0.26ms | 0.25ms | +0.0042ms | +1.64% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0016ms |
| p95 | 0.0062ms |
| p99 | 0.0080ms |
| mean | 0.0022ms |
| stdev | 0.0017ms |
| min | 0.00096ms |
| max | 0.0080ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.00016ms | -13.05% |
| p50 | 0.0016ms | 0.0018ms | -0.00021ms | -11.35% |
| p95 | 0.0062ms | 0.0082ms | -0.0020ms | -24.25% |
| p99 | 0.0080ms | 0.01ms | -0.0021ms | -20.64% |
| mean | 0.0022ms | 0.0025ms | -0.00035ms | -13.95% |
| min | 0.00096ms | 0.0012ms | -0.00021ms | -17.82% |
| max | 0.0080ms | 0.01ms | -0.0029ms | -26.61% |
| total | 0.09ms | 0.10ms | -0.01ms | -13.95% |

