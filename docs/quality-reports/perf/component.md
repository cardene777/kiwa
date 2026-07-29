# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.01ms | 5ms | 0.00042ms | PASS | stable (p10 0% (閾値未満)、 p95 +71% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0047ms | 0.01ms | 10ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0029ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.06ms | 10ms | PASS |
| buildFormDriveCanvas | 0.03ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | 71760 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 372048 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0021ms |
| stdev | 0.0035ms |
| min | 0.00050ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00054ms | +0.0000010ms | +0.18% |
| p95 | 0.01ms | 0.0069ms | +0.0049ms | +71.10% |
| p99 | 0.01ms | 0.01ms | +0.0018ms | +16.34% |
| mean | 0.0021ms | 0.0016ms | +0.00044ms | +26.87% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | +0.0014ms | +11.75% |
| total | 0.06ms | 0.05ms | +0.01ms | +26.87% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0055ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0082ms |
| stdev | 0.0065ms |
| min | 0.0042ms |
| max | 0.04ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0042ms | +0.00050ms | +11.78% |
| p50 | 0.0055ms | 0.0049ms | +0.00060ms | +12.25% |
| p95 | 0.01ms | 0.01ms | -0.0017ms | -11.63% |
| p99 | 0.03ms | 0.03ms | +0.0064ms | +24.96% |
| mean | 0.0082ms | 0.0073ms | +0.00087ms | +11.87% |
| min | 0.0042ms | 0.0041ms | +0.000084ms | +2.06% |
| max | 0.04ms | 0.03ms | +0.0094ms | +31.57% |
| total | 0.25ms | 0.22ms | +0.03ms | +11.87% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0033ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0047ms |
| stdev | 0.0032ms |
| min | 0.0027ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0034ms | -0.00055ms | -16.10% |
| p50 | 0.0033ms | 0.0037ms | -0.00040ms | -10.74% |
| p95 | 0.01ms | 0.01ms | -0.0016ms | -11.90% |
| p99 | 0.02ms | 0.02ms | -0.0036ms | -19.10% |
| mean | 0.0047ms | 0.0053ms | -0.00060ms | -11.21% |
| min | 0.0027ms | 0.0033ms | -0.00054ms | -16.46% |
| max | 0.02ms | 0.02ms | -0.0042ms | -20.70% |
| total | 0.14ms | 0.16ms | -0.02ms | -11.21% |

