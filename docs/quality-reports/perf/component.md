# Perf Suite — component

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00057ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0011ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | 0.00054ms | 0.02ms | 5ms | 0.0011ms | PASS | stable (検知には +0.0011ms (baseline 比 +235%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| buildFormDriveCanvas | 0.0062ms | 0.12ms | 10ms | 0.0011ms | PASS | stable (換算後 p10 +25% (閾値未満)、 p95 +68% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderAndHashMarkup | 0.0039ms | 0.02ms | 5ms | 0.00094ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| buildButtonDriveCanvas | cpu | 0.09ms | 0.10ms | 0.00054ms | 0.006 | 0.005 | 0.00051ms | 0.00045ms |
| buildFormDriveCanvas | cpu | 0.09ms | 0.14ms | 0.0062ms | 0.072 | 0.057 | 0.0059ms | 0.0047ms |
| renderAndHashMarkup | cpu | 0.11ms | 0.12ms | 0.0039ms | 0.034 | 0.035 | 0.0032ms | 0.0033ms |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildButtonDriveCanvas | 0.02ms | 10ms | PASS |
| buildFormDriveCanvas | 0.30ms | 20ms | PASS |
| renderAndHashMarkup | 0.02ms | 10ms | PASS |

## Memory retention (30 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildButtonDriveCanvas | -10464 B | 0 B | 102400 B | yes | PASS |
| buildFormDriveCanvas | 2056 B | 0 B | 102400 B | yes | PASS |
| renderAndHashMarkup | 3920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildButtonDriveCanvas

# Perf Report — buildButtonDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.00054ms |
| p50 | 0.00071ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0031ms |
| stdev | 0.0051ms |
| min | 0.00050ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.936)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00051ms | 0.00045ms | +0.000054ms | +11.82% |
| p50 | 0.00066ms | 0.00063ms | +0.000038ms | +6.15% |
| p95 | 0.01ms | 0.0062ms | +0.0079ms | +126.62% |
| p99 | 0.02ms | 0.01ms | +0.0078ms | +68.89% |
| mean | 0.0029ms | 0.0018ms | +0.0011ms | +59.61% |
| min | 0.00047ms | 0.00038ms | +0.000093ms | +24.86% |
| max | 0.02ms | 0.01ms | +0.0078ms | +60.72% |
| total | 0.09ms | 0.05ms | +0.03ms | +59.61% |

### buildFormDriveCanvas

# Perf Report — buildFormDriveCanvas.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.010ms |
| p95 | 0.12ms |
| p99 | 0.16ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.0045ms |
| max | 0.18ms |
| total | 0.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.954)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0047ms | +0.0012ms | +25.06% |
| p50 | 0.0095ms | 0.01ms | -0.00092ms | -8.78% |
| p95 | 0.12ms | 0.07ms | +0.05ms | +67.59% |
| p99 | 0.16ms | 0.25ms | -0.09ms | -35.86% |
| mean | 0.03ms | 0.03ms | +0.00042ms | +1.58% |
| min | 0.0043ms | 0.0042ms | +0.000047ms | +1.11% |
| max | 0.17ms | 0.30ms | -0.14ms | -44.61% |
| total | 0.81ms | 0.79ms | +0.01ms | +1.58% |

### renderAndHashMarkup

# Perf Report — renderAndHashMarkup.serial

| metric | value |
|---|---|
| iterations | 30 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0045ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0070ms |
| stdev | 0.0054ms |
| min | 0.0038ms |
| max | 0.03ms |
| total | 0.21ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.826)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0033ms | -0.000061ms | -1.86% |
| p50 | 0.0037ms | 0.0040ms | -0.00024ms | -6.13% |
| p95 | 0.02ms | 0.01ms | +0.0021ms | +15.84% |
| p99 | 0.02ms | 0.02ms | +0.00099ms | +5.12% |
| mean | 0.0058ms | 0.0058ms | +0.0000075ms | +0.13% |
| min | 0.0032ms | 0.0032ms | -0.000085ms | -2.62% |
| max | 0.02ms | 0.02ms | +0.00082ms | +4.06% |
| total | 0.17ms | 0.17ms | +0.00023ms | +0.13% |

