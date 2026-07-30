# Perf Suite — quality-metrics

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | 0.00029ms | 0.0034ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +116%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| evaluateReleaseGate_11axis | 0.00021ms | 0.00034ms | 5ms | 0.00034ms | PASS | stable (検知には +0.00034ms (baseline 比 +163%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| diffReports | 0.00033ms | 0.0035ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | cpu | 0.08ms | 0.09ms | 0.00029ms | 0.004 | 0.004 | 0.00030ms | 0.00029ms |
| evaluateReleaseGate_11axis | cpu | 0.08ms | 0.09ms | 0.00021ms | 0.003 | 0.003 | 0.00021ms | 0.00021ms |
| diffReports | cpu | 0.08ms | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateReleaseGate_7axis | 0.02ms | 10ms | PASS |
| evaluateReleaseGate_11axis | 0.01ms | 10ms | PASS |
| diffReports | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateReleaseGate_7axis | -5000 B | 0 B | 102400 B | yes | PASS |
| evaluateReleaseGate_11axis | 520 B | 0 B | 102400 B | yes | PASS |
| diffReports | 536 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateReleaseGate_7axis

# Perf Report — evaluateReleaseGate_7axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0034ms |
| p99 | 0.0082ms |
| mean | 0.00083ms |
| stdev | 0.0015ms |
| min | 0.00029ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00030ms | 0.00029ms | +0.0000052ms | +1.80% |
| p50 | 0.00034ms | 0.00033ms | +0.0000058ms | +1.75% |
| p95 | 0.0035ms | 0.0025ms | +0.00094ms | +37.50% |
| p99 | 0.0083ms | 0.0091ms | -0.00077ms | -8.48% |
| mean | 0.00084ms | 0.00077ms | +0.000069ms | +8.99% |
| min | 0.00030ms | 0.00029ms | +0.0000042ms | +1.45% |
| max | 0.01ms | 0.01ms | +0.00062ms | +5.80% |
| total | 0.17ms | 0.15ms | +0.01ms | +8.99% |

### evaluateReleaseGate_11axis

# Perf Report — evaluateReleaseGate_11axis.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00021ms |
| p95 | 0.00034ms |
| p99 | 0.0030ms |
| mean | 0.00035ms |
| stdev | 0.00096ms |
| min | 0.00021ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.019)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00021ms | 0.00021ms | +0.0000040ms | +1.91% |
| p50 | 0.00021ms | 0.00025ms | -0.000037ms | -14.81% |
| p95 | 0.00035ms | 0.0048ms | -0.0044ms | -92.69% |
| p99 | 0.0031ms | 0.0087ms | -0.0056ms | -64.85% |
| mean | 0.00036ms | 0.00087ms | -0.00051ms | -58.88% |
| min | 0.00021ms | 0.00021ms | +0.0000040ms | +1.91% |
| max | 0.01ms | 0.01ms | -0.00078ms | -6.22% |
| total | 0.07ms | 0.17ms | -0.10ms | -58.88% |

### diffReports

# Perf Report — diffReports.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0035ms |
| p99 | 0.01ms |
| mean | 0.00085ms |
| stdev | 0.0024ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | -6.9e-7ms | -0.21% |
| p50 | 0.00037ms | 0.00038ms | -7.7e-7ms | -0.21% |
| p95 | 0.0035ms | 0.0038ms | -0.00030ms | -7.94% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +10.66% |
| mean | 0.00085ms | 0.00090ms | -0.000042ms | -4.67% |
| min | 0.00033ms | 0.00033ms | -6.9e-7ms | -0.21% |
| max | 0.02ms | 0.02ms | +0.0031ms | +15.49% |
| total | 0.17ms | 0.18ms | -0.0084ms | -4.67% |

