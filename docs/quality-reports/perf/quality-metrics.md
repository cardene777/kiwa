# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00033ms | 0.0018ms | 5ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00046ms | 0.00058ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| diffReports | 0.00050ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 +9% (閾値未満)、 p95 +64% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.01ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -8144 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 600 B | 0 B | 102400 B | yes | PASS |
| diffReports | 696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00058ms |
| p95 | 0.0018ms |
| p99 | 0.0080ms |
| mean | 0.00083ms |
| stdev | 0.0016ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00092ms | -0.00058ms | -63.58% |
| p50 | 0.00058ms | 0.0013ms | -0.00071ms | -54.88% |
| p95 | 0.0018ms | 0.0031ms | -0.0013ms | -43.31% |
| p99 | 0.0080ms | 0.01ms | -0.0023ms | -21.98% |
| mean | 0.00083ms | 0.0015ms | -0.00071ms | -45.88% |
| min | 0.00033ms | 0.00088ms | -0.00054ms | -61.94% |
| max | 0.02ms | 0.02ms | -0.00050ms | -3.09% |
| total | 0.17ms | 0.31ms | -0.14ms | -45.88% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00046ms |
| p95 | 0.00058ms |
| p99 | 0.00083ms |
| mean | 0.00048ms |
| stdev | 0.00018ms |
| min | 0.00042ms |
| max | 0.0028ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00042ms | +0.000042ms | +10.10% |
| p50 | 0.00046ms | 0.00042ms | +0.000041ms | +9.83% |
| p95 | 0.00058ms | 0.00063ms | -0.000044ms | -7.03% |
| p99 | 0.00083ms | 0.0011ms | -0.00025ms | -23.21% |
| mean | 0.00048ms | 0.00047ms | +0.000019ms | +3.98% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.0028ms | 0.0015ms | +0.0014ms | +94.17% |
| total | 0.10ms | 0.09ms | +0.0037ms | +3.98% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0013ms |
| p99 | 0.01ms |
| mean | 0.00095ms |
| stdev | 0.0023ms |
| min | 0.00046ms |
| max | 0.03ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00046ms | +0.000041ms | +8.96% |
| p50 | 0.00054ms | 0.00050ms | +0.000042ms | +8.40% |
| p95 | 0.0013ms | 0.00079ms | +0.00051ms | +64.47% |
| p99 | 0.01ms | 0.0067ms | +0.0037ms | +54.97% |
| mean | 0.00095ms | 0.00073ms | +0.00021ms | +28.97% |
| min | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| max | 0.03ms | 0.01ms | +0.01ms | +114.06% |
| total | 0.19ms | 0.15ms | +0.04ms | +28.97% |

