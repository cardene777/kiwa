# Perf Suite — date

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| addDays | 0.00021ms | 0.0010ms | 5ms | 0.00035ms | PASS | stable (検知には +0.00035ms (baseline 比 +139%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| formatDate | 0.00088ms | 0.0034ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| createDateClient | 0.00029ms | 0.0011ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +117%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| addDays | cpu | 0.08ms | 0.09ms | 0.00021ms | 0.003 | 0.003 | 0.00022ms | 0.00025ms |
| formatDate | cpu | 0.08ms | 0.09ms | 0.00088ms | 0.011 | 0.011 | 0.00089ms | 0.00092ms |
| createDateClient | cpu | 0.08ms | 0.09ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| addDays | 0.01ms | 10ms | PASS |
| formatDate | 0.02ms | 10ms | PASS |
| createDateClient | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| addDays | -10664 B | 0 B | 102400 B | yes | PASS |
| formatDate | -18216 B | 0 B | 102400 B | yes | PASS |
| createDateClient | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### addDays

# Perf Report — addDays.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.0010ms |
| p99 | 0.0052ms |
| mean | 0.00046ms |
| stdev | 0.0011ms |
| min | 0.00017ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.049)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00022ms | 0.00025ms | -0.000032ms | -12.69% |
| p50 | 0.00022ms | 0.00029ms | -0.000073ms | -24.89% |
| p95 | 0.0011ms | 0.0055ms | -0.0044ms | -80.59% |
| p99 | 0.0054ms | 0.0097ms | -0.0043ms | -43.99% |
| mean | 0.00048ms | 0.0014ms | -0.00090ms | -65.22% |
| min | 0.00017ms | 0.00021ms | -0.000034ms | -16.25% |
| max | 0.01ms | 0.09ms | -0.08ms | -88.40% |
| total | 0.10ms | 0.28ms | -0.18ms | -65.22% |

### formatDate

# Perf Report — formatDate.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0034ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0025ms |
| min | 0.00079ms |
| max | 0.02ms |
| total | 0.30ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.017)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00089ms | 0.00092ms | -0.000026ms | -2.86% |
| p50 | 0.0010ms | 0.0011ms | -0.000066ms | -6.11% |
| p95 | 0.0035ms | 0.01ms | -0.01ms | -75.73% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -62.65% |
| mean | 0.0015ms | 0.0032ms | -0.0016ms | -51.06% |
| min | 0.00080ms | 0.00083ms | -0.000029ms | -3.44% |
| max | 0.02ms | 0.04ms | -0.02ms | -43.66% |
| total | 0.31ms | 0.63ms | -0.32ms | -51.06% |

### createDateClient

# Perf Report — createDateClient.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0011ms |
| p99 | 0.0098ms |
| mean | 0.00070ms |
| stdev | 0.0020ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.025)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000073ms | +2.51% |
| p50 | 0.00034ms | 0.00033ms | +0.0000084ms | +2.51% |
| p95 | 0.0011ms | 0.0012ms | -0.000046ms | -3.95% |
| p99 | 0.01ms | 0.0062ms | +0.0039ms | +62.55% |
| mean | 0.00071ms | 0.00056ms | +0.00016ms | +28.54% |
| min | 0.00030ms | 0.00029ms | +0.0000073ms | +2.51% |
| max | 0.02ms | 0.01ms | +0.0090ms | +67.55% |
| total | 0.14ms | 0.11ms | +0.03ms | +28.54% |

