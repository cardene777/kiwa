# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0043ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0010ms | 0.0071ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 17800 B | 0 B | 102400 B | yes | PASS |
| runQuery | -246672 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0047ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0040ms |
| min | 0.0042ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00020ms | -4.58% |
| p50 | 0.0047ms | 0.0049ms | -0.00025ms | -5.07% |
| p95 | 0.01ms | 0.01ms | -0.0018ms | -13.83% |
| p99 | 0.02ms | 0.02ms | +0.0031ms | +17.55% |
| mean | 0.0062ms | 0.0063ms | -0.00011ms | -1.74% |
| min | 0.0042ms | 0.0044ms | -0.00017ms | -3.82% |
| max | 0.03ms | 0.02ms | +0.0056ms | +27.75% |
| total | 0.25ms | 0.25ms | -0.0044ms | -1.74% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0015ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0023ms |
| stdev | 0.0024ms |
| min | 0.00092ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0012ms | -0.00025ms | -19.80% |
| p50 | 0.0015ms | 0.0018ms | -0.00029ms | -15.88% |
| p95 | 0.0071ms | 0.0082ms | -0.0010ms | -12.56% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +16.16% |
| mean | 0.0023ms | 0.0025ms | -0.00019ms | -7.43% |
| min | 0.00092ms | 0.0012ms | -0.00025ms | -21.51% |
| max | 0.01ms | 0.01ms | +0.0026ms | +23.96% |
| total | 0.09ms | 0.10ms | -0.0075ms | -7.43% |

