# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.0069ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0049ms | 0.02ms | 10ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0031ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.02ms | 10ms | PASS |
| buildFormDriveCanvas | 0.03ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -10104 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 19624 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0069ms |
| p99 | 0.0097ms |
| mean | 0.0016ms |
| stdev | 0.0023ms |
| min | 0.00046ms |
| max | 0.010ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | +5.0e-7ms | +0.09% |
| p95 | 0.0069ms | 0.0069ms | -0.000040ms | -0.58% |
| p99 | 0.0097ms | 0.01ms | -0.0014ms | -12.74% |
| mean | 0.0016ms | 0.0016ms | -0.000069ms | -4.23% |
| min | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| max | 0.010ms | 0.01ms | -0.0017ms | -14.94% |
| total | 0.05ms | 0.05ms | -0.0021ms | -4.23% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0057ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0056ms |
| min | 0.0046ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0042ms | +0.00070ms | +16.65% |
| p50 | 0.0057ms | 0.0049ms | +0.00077ms | +15.63% |
| p95 | 0.02ms | 0.01ms | +0.000096ms | +0.64% |
| p99 | 0.03ms | 0.03ms | +0.0024ms | +9.40% |
| mean | 0.0082ms | 0.0073ms | +0.00088ms | +11.98% |
| min | 0.0046ms | 0.0041ms | +0.00054ms | +13.27% |
| max | 0.03ms | 0.03ms | +0.0036ms | +12.15% |
| total | 0.25ms | 0.22ms | +0.03ms | +11.98% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0034ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0037ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0034ms | -0.00030ms | -8.67% |
| p50 | 0.0034ms | 0.0037ms | -0.00027ms | -7.36% |
| p95 | 0.01ms | 0.01ms | -0.00034ms | -2.49% |
| p99 | 0.02ms | 0.02ms | -0.0014ms | -7.61% |
| mean | 0.0049ms | 0.0053ms | -0.00040ms | -7.56% |
| min | 0.0030ms | 0.0033ms | -0.00025ms | -7.62% |
| max | 0.02ms | 0.02ms | -0.0022ms | -11.06% |
| total | 0.15ms | 0.16ms | -0.01ms | -7.56% |

