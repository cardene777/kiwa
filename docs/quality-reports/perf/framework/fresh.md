# Perf Suite — fresh

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeFreshHandler | 0.0077ms | 0.03ms | 5ms | 0.00033ms | PASS | stable (p10 -7% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mountIsland | 0.0014ms | 0.0021ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeFreshHandler | 0.15ms | 10ms | PASS |
| mountIsland | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeFreshHandler | -85752 B | -10643 B | 102400 B | yes | PASS |
| mountIsland | -216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeFreshHandler

# Perf Report — invokeFreshHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0097ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.05ms |
| min | 0.0075ms |
| max | 0.66ms |
| total | 3.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0084ms | -0.00062ms | -7.42% |
| p50 | 0.0097ms | 0.01ms | -0.00048ms | -4.69% |
| p95 | 0.03ms | 0.02ms | +0.0065ms | +28.67% |
| p99 | 0.07ms | 0.06ms | +0.01ms | +17.44% |
| mean | 0.02ms | 0.01ms | +0.0031ms | +23.59% |
| min | 0.0075ms | 0.0078ms | -0.00033ms | -4.25% |
| max | 0.66ms | 0.10ms | +0.57ms | +574.09% |
| total | 3.22ms | 2.60ms | +0.61ms | +23.59% |

### mountIsland

# Perf Report — mountIsland.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0021ms |
| p99 | 0.0064ms |
| mean | 0.0017ms |
| stdev | 0.0013ms |
| min | 0.0014ms |
| max | 0.02ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | +0.000042ms | +3.05% |
| p50 | 0.0015ms | 0.0014ms | +0.000043ms | +3.04% |
| p95 | 0.0021ms | 0.0022ms | -0.000084ms | -3.87% |
| p99 | 0.0064ms | 0.0072ms | -0.00072ms | -10.12% |
| mean | 0.0017ms | 0.0017ms | +0.000012ms | +0.67% |
| min | 0.0014ms | 0.0013ms | +0.000042ms | +3.15% |
| max | 0.02ms | 0.02ms | +0.0013ms | +8.51% |
| total | 0.35ms | 0.35ms | +0.0023ms | +0.67% |

