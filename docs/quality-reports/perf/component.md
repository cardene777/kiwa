# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00058ms | 0.0081ms | 5ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0059ms | 0.02ms | 10ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0035ms | 0.02ms | 5ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.03ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | 309392 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 22288 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00058ms |
| p50 | 0.00058ms |
| p95 | 0.0081ms |
| p99 | 0.01ms |
| mean | 0.0018ms |
| stdev | 0.0027ms |
| min | 0.00058ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00058ms | 0.00050ms | +0.000083ms | +16.60% |
| p50 | 0.00058ms | 0.00054ms | +0.000043ms | +7.95% |
| p95 | 0.0081ms | 0.0069ms | +0.0012ms | +17.34% |
| p99 | 0.01ms | 0.01ms | -0.0000090ms | -0.08% |
| mean | 0.0018ms | 0.0016ms | +0.00019ms | +11.44% |
| min | 0.00058ms | 0.00050ms | +0.000083ms | +16.60% |
| max | 0.01ms | 0.01ms | -0.00062ms | -5.34% |
| total | 0.05ms | 0.05ms | +0.0056ms | +11.44% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0067ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0096ms |
| stdev | 0.0062ms |
| min | 0.0049ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0042ms | +0.0017ms | +39.22% |
| p50 | 0.0067ms | 0.0049ms | +0.0017ms | +35.03% |
| p95 | 0.02ms | 0.01ms | +0.0021ms | +14.03% |
| p99 | 0.03ms | 0.03ms | +0.0050ms | +19.40% |
| mean | 0.0096ms | 0.0073ms | +0.0023ms | +30.66% |
| min | 0.0049ms | 0.0041ms | +0.00083ms | +20.43% |
| max | 0.04ms | 0.03ms | +0.0064ms | +21.51% |
| total | 0.29ms | 0.22ms | +0.07ms | +30.66% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0037ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0055ms |
| stdev | 0.0043ms |
| min | 0.0034ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0034ms | +0.000041ms | +1.20% |
| p50 | 0.0037ms | 0.0037ms | 0.00ms | 0.00% |
| p95 | 0.02ms | 0.01ms | +0.0016ms | +11.46% |
| p99 | 0.02ms | 0.02ms | +0.0011ms | +5.97% |
| mean | 0.0055ms | 0.0053ms | +0.00013ms | +2.48% |
| min | 0.0034ms | 0.0033ms | +0.00013ms | +3.80% |
| max | 0.02ms | 0.02ms | +0.00079ms | +3.90% |
| total | 0.16ms | 0.16ms | +0.0040ms | +2.48% |

