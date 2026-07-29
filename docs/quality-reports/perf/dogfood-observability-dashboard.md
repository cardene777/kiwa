# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0067ms | 0.01ms | 30ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| runQuery | 0.0011ms | 0.0078ms | 20ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.07ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 18712 B | 0 B | 102400 B | yes | PASS |
| runQuery | 24552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0068ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0035ms |
| min | 0.0066ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0045ms | +0.0023ms | +50.63% |
| p50 | 0.0068ms | 0.0049ms | +0.0019ms | +39.02% |
| p95 | 0.01ms | 0.01ms | +0.00011ms | +0.85% |
| p99 | 0.02ms | 0.02ms | +0.0045ms | +25.20% |
| mean | 0.0080ms | 0.0063ms | +0.0017ms | +26.36% |
| min | 0.0066ms | 0.0044ms | +0.0022ms | +51.43% |
| max | 0.03ms | 0.02ms | +0.0049ms | +24.43% |
| total | 0.32ms | 0.25ms | +0.07ms | +26.36% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0017ms |
| p95 | 0.0078ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0023ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.00016ms | -12.71% |
| p50 | 0.0017ms | 0.0018ms | -0.00012ms | -6.82% |
| p95 | 0.0078ms | 0.0082ms | -0.00032ms | -3.97% |
| p99 | 0.01ms | 0.01ms | +0.0011ms | +10.69% |
| mean | 0.0025ms | 0.0025ms | -0.000063ms | -2.48% |
| min | 0.0010ms | 0.0012ms | -0.00013ms | -10.71% |
| max | 0.01ms | 0.01ms | +0.00033ms | +3.04% |
| total | 0.10ms | 0.10ms | -0.0025ms | -2.48% |

