# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.0073ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0051ms | 0.02ms | 10ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0030ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.02ms | 10ms | PASS |
| buildFormDriveCanvas | 0.05ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -13640 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 26080 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | -1152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0073ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0025ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.0073ms | 0.0069ms | +0.00038ms | +5.50% |
| p99 | 0.01ms | 0.01ms | -0.00077ms | -6.91% |
| mean | 0.0016ms | 0.0016ms | -0.000032ms | -1.96% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.0013ms | -11.39% |
| total | 0.05ms | 0.05ms | -0.00096ms | -1.96% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0060ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0086ms |
| stdev | 0.0057ms |
| min | 0.0046ms |
| max | 0.03ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0042ms | +0.00091ms | +21.69% |
| p50 | 0.0060ms | 0.0049ms | +0.0010ms | +21.12% |
| p95 | 0.02ms | 0.01ms | +0.0035ms | +23.38% |
| p99 | 0.03ms | 0.03ms | +0.0019ms | +7.56% |
| mean | 0.0086ms | 0.0073ms | +0.0012ms | +16.88% |
| min | 0.0046ms | 0.0041ms | +0.00054ms | +13.27% |
| max | 0.03ms | 0.03ms | +0.00054ms | +1.82% |
| total | 0.26ms | 0.22ms | +0.04ms | +16.88% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0034ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0048ms |
| stdev | 0.0032ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0034ms | -0.00038ms | -11.12% |
| p50 | 0.0034ms | 0.0037ms | -0.00027ms | -7.36% |
| p95 | 0.01ms | 0.01ms | -0.0013ms | -9.74% |
| p99 | 0.02ms | 0.02ms | -0.0037ms | -19.79% |
| mean | 0.0048ms | 0.0053ms | -0.00058ms | -10.82% |
| min | 0.0030ms | 0.0033ms | -0.00033ms | -10.12% |
| max | 0.02ms | 0.02ms | -0.0047ms | -23.36% |
| total | 0.14ms | 0.16ms | -0.02ms | -10.82% |

