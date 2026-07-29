# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0029ms | 0.0042ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0059ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.05ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -42128 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0042ms |
| p99 | 0.0096ms |
| mean | 0.0033ms |
| stdev | 0.0014ms |
| min | 0.0022ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.00017ms | -5.49% |
| p50 | 0.0030ms | 0.0032ms | -0.00017ms | -5.24% |
| p95 | 0.0042ms | 0.0055ms | -0.0013ms | -23.99% |
| p99 | 0.0096ms | 0.0095ms | +0.00012ms | +1.30% |
| mean | 0.0033ms | 0.0036ms | -0.00032ms | -8.68% |
| min | 0.0022ms | 0.0021ms | +0.000041ms | +1.93% |
| max | 0.01ms | 0.01ms | +0.0010ms | +9.33% |
| total | 0.17ms | 0.18ms | -0.02ms | -8.68% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0086ms |
| min | 0.0058ms |
| max | 0.03ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0061ms | -0.00025ms | -4.08% |
| p50 | 0.01ms | 0.02ms | -0.0065ms | -30.23% |
| p95 | 0.03ms | 0.03ms | -0.0034ms | -10.75% |
| p99 | 0.03ms | 0.20ms | -0.17ms | -84.64% |
| mean | 0.01ms | 0.03ms | -0.01ms | -45.17% |
| min | 0.0058ms | 0.0060ms | -0.00021ms | -3.46% |
| max | 0.03ms | 0.36ms | -0.33ms | -91.10% |
| total | 0.72ms | 1.32ms | -0.60ms | -45.17% |

