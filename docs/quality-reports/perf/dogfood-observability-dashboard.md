# Perf Suite — dogfood-observability-dashboard

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| refreshDashboard | 0.0043ms | 0.01ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| runQuery | 0.0010ms | 0.0080ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| refreshDashboard | 0.05ms | 60ms | PASS |
| runQuery | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| refreshDashboard | 17688 B | 0 B | 102400 B | yes | PASS |
| runQuery | -220856 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### refreshDashboard

# Perf Report — refreshDashboard.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0043ms |
| p50 | 0.0049ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0063ms |
| stdev | 0.0046ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0043ms | 0.0045ms | -0.00012ms | -2.69% |
| p50 | 0.0049ms | 0.0049ms | -0.000041ms | -0.83% |
| p95 | 0.01ms | 0.01ms | -0.00079ms | -6.05% |
| p99 | 0.03ms | 0.02ms | +0.0072ms | +40.52% |
| mean | 0.0063ms | 0.0063ms | -0.000089ms | -1.40% |
| min | 0.0043ms | 0.0044ms | -0.000084ms | -1.92% |
| max | 0.03ms | 0.02ms | +0.0053ms | +26.30% |
| total | 0.25ms | 0.25ms | -0.0035ms | -1.40% |

### runQuery

# Perf Report — runQuery.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0015ms |
| p95 | 0.0080ms |
| p99 | 0.01ms |
| mean | 0.0024ms |
| stdev | 0.0023ms |
| min | 0.00079ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0012ms | -0.00025ms | -19.80% |
| p50 | 0.0015ms | 0.0018ms | -0.00033ms | -18.17% |
| p95 | 0.0080ms | 0.0082ms | -0.00020ms | -2.43% |
| p99 | 0.01ms | 0.01ms | +0.00017ms | +1.73% |
| mean | 0.0024ms | 0.0025ms | -0.000085ms | -3.39% |
| min | 0.00079ms | 0.0012ms | -0.00038ms | -32.13% |
| max | 0.01ms | 0.01ms | +0.00079ms | +7.23% |
| total | 0.10ms | 0.10ms | -0.0034ms | -3.39% |

