# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.0077ms | 5ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0060ms | 0.02ms | 10ms | 0.00049ms | PASS | regressed — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0031ms | 0.02ms | 5ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.02ms | 10ms | PASS |
| buildFormDriveCanvas | 0.28ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -10488 B | -17704 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 8616 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 4344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0017ms |
| stdev | 0.0027ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.0077ms | 0.0069ms | +0.00078ms | +11.22% |
| p99 | 0.01ms | 0.01ms | +0.00023ms | +2.09% |
| mean | 0.0017ms | 0.0016ms | +0.000065ms | +3.98% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00017ms | -1.43% |
| total | 0.05ms | 0.05ms | +0.0020ms | +3.98% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0077ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0097ms |
| stdev | 0.0058ms |
| min | 0.0050ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0042ms | +0.0018ms | +43.27% |
| p50 | 0.0077ms | 0.0049ms | +0.0027ms | +55.29% |
| p95 | 0.02ms | 0.01ms | +0.0018ms | +12.13% |
| p99 | 0.03ms | 0.03ms | +0.0052ms | +20.28% |
| mean | 0.0097ms | 0.0073ms | +0.0024ms | +32.14% |
| min | 0.0050ms | 0.0041ms | +0.00087ms | +21.43% |
| max | 0.04ms | 0.03ms | +0.0062ms | +20.81% |
| total | 0.29ms | 0.22ms | +0.07ms | +32.14% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0033ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0050ms |
| stdev | 0.0041ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0034ms | -0.00029ms | -8.55% |
| p50 | 0.0033ms | 0.0037ms | -0.00035ms | -9.60% |
| p95 | 0.02ms | 0.01ms | +0.0014ms | +10.04% |
| p99 | 0.02ms | 0.02ms | -0.00029ms | -1.55% |
| mean | 0.0050ms | 0.0053ms | -0.00033ms | -6.28% |
| min | 0.0030ms | 0.0033ms | -0.00033ms | -10.15% |
| max | 0.02ms | 0.02ms | -0.0014ms | -6.97% |
| total | 0.15ms | 0.16ms | -0.01ms | -6.28% |

