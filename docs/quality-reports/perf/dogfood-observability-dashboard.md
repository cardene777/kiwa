# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0043ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0011ms | 0.0087ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.07ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 17688 B | 0 B | 102400 B | yes | PASS |
| runQuery | 22512 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.0064ms |
| stdev | 0.0038ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00017ms | -3.73% |
| p50 | 0.0047ms | 0.0049ms | -0.00023ms | -4.65% |
| p95 | 0.01ms | 0.01ms | +0.00018ms | +1.38% |
| p99 | 0.02ms | 0.02ms | +0.0020ms | +10.96% |
| mean | 0.0064ms | 0.0063ms | +0.000010ms | +0.16% |
| min | 0.0043ms | 0.0044ms | -0.00013ms | -2.86% |
| max | 0.02ms | 0.02ms | +0.0034ms | +16.98% |
| total | 0.25ms | 0.25ms | +0.00042ms | +0.16% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0017ms |
| p95 | 0.0087ms |
| p99 | 0.01ms |
| mean | 0.0026ms |
| stdev | 0.0025ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0012ms | -0.00012ms | -9.74% |
| p50 | 0.0017ms | 0.0018ms | -0.00010ms | -5.65% |
| p95 | 0.0087ms | 0.0082ms | +0.00056ms | +6.85% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +14.26% |
| mean | 0.0026ms | 0.0025ms | +0.000083ms | +3.30% |
| min | 0.0010ms | 0.0012ms | -0.00017ms | -14.31% |
| max | 0.01ms | 0.01ms | +0.00079ms | +7.23% |
| total | 0.10ms | 0.10ms | +0.0033ms | +3.30% |

