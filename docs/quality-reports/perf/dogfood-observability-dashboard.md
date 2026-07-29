# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0043ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0010ms | 0.0073ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 18376 B | 0 B | 102400 B | yes | PASS |
| runQuery | -43752 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0048ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0059ms |
| stdev | 0.0030ms |
| min | 0.0042ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00020ms | -4.58% |
| p50 | 0.0048ms | 0.0049ms | -0.00015ms | -2.96% |
| p95 | 0.01ms | 0.01ms | -0.0017ms | -12.86% |
| p99 | 0.02ms | 0.02ms | -0.0020ms | -11.14% |
| mean | 0.0059ms | 0.0063ms | -0.00046ms | -7.22% |
| min | 0.0042ms | 0.0044ms | -0.00021ms | -4.75% |
| max | 0.02ms | 0.02ms | -0.0034ms | -16.98% |
| total | 0.24ms | 0.25ms | -0.02ms | -7.22% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0016ms |
| p95 | 0.0073ms |
| p99 | 0.010ms |
| mean | 0.0023ms |
| stdev | 0.0021ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0012ms | -0.00025ms | -19.80% |
| p50 | 0.0016ms | 0.0018ms | -0.00025ms | -13.61% |
| p95 | 0.0073ms | 0.0082ms | -0.00082ms | -10.08% |
| p99 | 0.010ms | 0.01ms | -0.00012ms | -1.18% |
| mean | 0.0023ms | 0.0025ms | -0.00020ms | -7.97% |
| min | 0.00092ms | 0.0012ms | -0.00025ms | -21.51% |
| max | 0.01ms | 0.01ms | +0.00071ms | +6.47% |
| total | 0.09ms | 0.10ms | -0.0080ms | -7.97% |

