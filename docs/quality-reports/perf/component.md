# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00050ms | 0.0071ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0051ms | 0.02ms | 10ms | 0.00042ms | PASS | regressed — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0030ms | 0.01ms | 5ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.05ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -13560 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 24624 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0071ms |
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
| p95 | 0.0071ms | 0.0069ms | +0.00016ms | +2.37% |
| p99 | 0.01ms | 0.01ms | -0.00074ms | -6.70% |
| mean | 0.0016ms | 0.0016ms | -0.0000014ms | -0.09% |
| min | 0.00050ms | 0.00050ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00087ms | -7.47% |
| total | 0.05ms | 0.05ms | -0.000043ms | -0.09% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0051ms |
| p50 | 0.0069ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0096ms |
| stdev | 0.0065ms |
| min | 0.0045ms |
| max | 0.03ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0042ms | +0.00091ms | +21.59% |
| p50 | 0.0069ms | 0.0049ms | +0.0020ms | +40.52% |
| p95 | 0.02ms | 0.01ms | +0.0084ms | +56.32% |
| p99 | 0.03ms | 0.03ms | +0.0042ms | +16.42% |
| mean | 0.0096ms | 0.0073ms | +0.0023ms | +31.17% |
| min | 0.0045ms | 0.0041ms | +0.00042ms | +10.21% |
| max | 0.03ms | 0.03ms | +0.0019ms | +6.43% |
| total | 0.29ms | 0.22ms | +0.07ms | +31.17% |

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
| stdev | 0.0036ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0034ms | -0.00038ms | -11.00% |
| p50 | 0.0034ms | 0.0037ms | -0.00031ms | -8.47% |
| p95 | 0.01ms | 0.01ms | -0.00018ms | -1.28% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -10.02% |
| mean | 0.0048ms | 0.0053ms | -0.00048ms | -9.02% |
| min | 0.0030ms | 0.0033ms | -0.00029ms | -8.87% |
| max | 0.02ms | 0.02ms | -0.0029ms | -14.14% |
| total | 0.15ms | 0.16ms | -0.01ms | -9.02% |

