# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.0079ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0053ms | 0.01ms | 10ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0028ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.03ms | 10ms | PASS |
| buildFormDriveCanvas | 0.03ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -13600 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 26704 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | -1056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0079ms |
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
| p95 | 0.0079ms | 0.0069ms | +0.00094ms | +13.64% |
| p99 | 0.01ms | 0.01ms | -0.000064ms | -0.58% |
| mean | 0.0017ms | 0.0016ms | +0.000057ms | +3.48% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00050ms | -4.26% |
| total | 0.05ms | 0.05ms | +0.0017ms | +3.48% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0053ms |
| p50 | 0.0061ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0085ms |
| stdev | 0.0058ms |
| min | 0.0051ms |
| max | 0.04ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0042ms | +0.0011ms | +25.76% |
| p50 | 0.0061ms | 0.0049ms | +0.0012ms | +23.64% |
| p95 | 0.01ms | 0.01ms | -0.00047ms | -3.16% |
| p99 | 0.03ms | 0.03ms | +0.0042ms | +16.25% |
| mean | 0.0085ms | 0.0073ms | +0.0012ms | +15.92% |
| min | 0.0051ms | 0.0041ms | +0.0010ms | +24.49% |
| max | 0.04ms | 0.03ms | +0.0057ms | +19.27% |
| total | 0.26ms | 0.22ms | +0.04ms | +15.92% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0036ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0051ms |
| stdev | 0.0035ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0034ms | -0.00058ms | -17.09% |
| p50 | 0.0036ms | 0.0037ms | -0.000042ms | -1.14% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -7.82% |
| p99 | 0.02ms | 0.02ms | -0.0026ms | -13.86% |
| mean | 0.0051ms | 0.0053ms | -0.00023ms | -4.28% |
| min | 0.0027ms | 0.0033ms | -0.00058ms | -17.74% |
| max | 0.02ms | 0.02ms | -0.0032ms | -15.58% |
| total | 0.15ms | 0.16ms | -0.0068ms | -4.28% |

