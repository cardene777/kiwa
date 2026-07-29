# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00054ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00038ms | 0.01ms | 5ms | 0.0011ms | PASS | stable (検知には +0.0011ms (baseline 比 +287%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0050ms | 0.01ms | 10ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0031ms | 0.01ms | 5ms | 0.0011ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00037ms | 0.00038ms |
| buildFormDriveCanvas | cpu | 0.08ms | 0.0050ms | 0.061 | 0.051 | 0.0050ms | 0.0042ms |
| renderAndHashMarkup | cpu | 0.08ms | 0.0031ms | 0.038 | 0.034 | 0.0031ms | 0.0027ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.01ms | 10ms | PASS |
| buildFormDriveCanvas | 0.14ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -15312 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | -1256 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00038ms |
| p50 | 0.00060ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0048ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00060ms | 0.00052ms | +0.000084ms | +16.14% |
| p95 | 0.01ms | 0.0086ms | +0.0044ms | +50.72% |
| p99 | 0.02ms | 0.01ms | +0.0071ms | +59.11% |
| mean | 0.0028ms | 0.0021ms | +0.00067ms | +31.85% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.0077ms | +58.30% |
| total | 0.08ms | 0.06ms | +0.02ms | +31.85% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0069ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0082ms |
| stdev | 0.0048ms |
| min | 0.0043ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0042ms | +0.00083ms | +19.89% |
| p50 | 0.0069ms | 0.0049ms | +0.0020ms | +41.20% |
| p95 | 0.01ms | 0.01ms | -0.00032ms | -2.25% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +8.45% |
| mean | 0.0082ms | 0.0069ms | +0.0013ms | +18.06% |
| min | 0.0043ms | 0.0041ms | +0.00021ms | +5.07% |
| max | 0.03ms | 0.03ms | +0.0027ms | +10.49% |
| total | 0.25ms | 0.21ms | +0.04ms | +18.06% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0035ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0049ms |
| stdev | 0.0034ms |
| min | 0.0030ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0027ms | +0.00038ms | +13.83% |
| p50 | 0.0035ms | 0.0032ms | +0.00031ms | +9.76% |
| p95 | 0.01ms | 0.01ms | -0.0015ms | -11.56% |
| p99 | 0.02ms | 0.02ms | -0.0013ms | -6.91% |
| mean | 0.0049ms | 0.0050ms | -0.00010ms | -2.10% |
| min | 0.0030ms | 0.0026ms | +0.00042ms | +15.85% |
| max | 0.02ms | 0.02ms | -0.0011ms | -5.75% |
| total | 0.15ms | 0.15ms | -0.0031ms | -2.10% |

