# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0075ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| mountIsland | 0.0013ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.14ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -122152 B | 0 B | 102400 B | yes | PASS |
| mountIsland | -7376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0075ms |
| p50 | 0.0090ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0072ms |
| max | 0.56ms |
| total | 3.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0075ms | 0.0084ms | -0.00087ms | -10.40% |
| p50 | 0.0090ms | 0.01ms | -0.0012ms | -12.25% |
| p95 | 0.03ms | 0.02ms | +0.0041ms | +17.90% |
| p99 | 0.07ms | 0.06ms | +0.0043ms | +6.82% |
| mean | 0.02ms | 0.01ms | +0.0020ms | +15.39% |
| min | 0.0072ms | 0.0078ms | -0.00062ms | -7.98% |
| max | 0.56ms | 0.10ms | +0.46ms | +469.02% |
| total | 3.00ms | 2.60ms | +0.40ms | +15.39% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0013ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0061ms |
| mean | 0.0016ms |
| stdev | 0.0013ms |
| min | 0.0013ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000046ms | -3.35% |
| p50 | 0.0013ms | 0.0014ms | -0.000082ms | -5.79% |
| p95 | 0.0018ms | 0.0022ms | -0.00034ms | -15.52% |
| p99 | 0.0061ms | 0.0072ms | -0.0010ms | -14.26% |
| mean | 0.0016ms | 0.0017ms | -0.000086ms | -4.95% |
| min | 0.0013ms | 0.0013ms | -0.000042ms | -3.15% |
| max | 0.02ms | 0.02ms | +0.00046ms | +3.02% |
| total | 0.33ms | 0.35ms | -0.02ms | -4.95% |

