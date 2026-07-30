# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateFlag | 0.00038ms | 0.0025ms | 5ms | 0.00090ms | PASS | stable (検知には +0.00090ms (baseline 比 +239%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| evaluateAllFlags | 0.00092ms | 0.0021ms | 5ms | 0.00093ms | PASS | stable (検知には +0.00093ms (baseline 比 +101%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| registerRule | 0.00017ms | 0.00055ms | 5ms | 0.00091ms | PASS | stable (検知には +0.00091ms (baseline 比 +550%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| evaluateFlag | cpu | 0.08ms | 0.09ms | 0.00038ms | 0.004 | 0.005 | 0.00037ms | 0.00038ms |
| evaluateAllFlags | cpu | 0.08ms | 0.08ms | 0.00092ms | 0.011 | 0.011 | 0.00093ms | 0.00092ms |
| registerRule | cpu | 0.08ms | 0.08ms | 0.00017ms | 0.002 | 0.002 | 0.00017ms | 0.00017ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 20216 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 71392 B | 0 B | 102400 B | yes | PASS |
| registerRule | 19056 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0025ms |
| p99 | 0.02ms |
| mean | 0.0017ms |
| stdev | 0.0097ms |
| min | 0.00038ms |
| max | 0.13ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00037ms | 0.00038ms | -0.0000075ms | -2.00% |
| p50 | 0.00041ms | 0.00046ms | -0.000050ms | -10.97% |
| p95 | 0.0025ms | 0.0046ms | -0.0021ms | -46.01% |
| p99 | 0.02ms | 0.02ms | +0.00068ms | +4.52% |
| mean | 0.0016ms | 0.0012ms | +0.00042ms | +35.21% |
| min | 0.00037ms | 0.00038ms | -0.0000075ms | -2.00% |
| max | 0.13ms | 0.02ms | +0.11ms | +488.74% |
| total | 0.33ms | 0.24ms | +0.08ms | +35.21% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00092ms |
| p50 | 0.00096ms |
| p95 | 0.0021ms |
| p99 | 0.02ms |
| mean | 0.0016ms |
| stdev | 0.0042ms |
| min | 0.00088ms |
| max | 0.05ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.013)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00093ms | 0.00092ms | +0.000011ms | +1.15% |
| p50 | 0.00097ms | 0.0010ms | -0.000029ms | -2.90% |
| p95 | 0.0021ms | 0.0020ms | +0.00014ms | +7.02% |
| p99 | 0.02ms | 0.0061ms | +0.01ms | +234.40% |
| mean | 0.0016ms | 0.0014ms | +0.00022ms | +16.26% |
| min | 0.00089ms | 0.00088ms | +0.000011ms | +1.26% |
| max | 0.05ms | 0.04ms | +0.0089ms | +21.65% |
| total | 0.32ms | 0.28ms | +0.04ms | +16.26% |

### registerRule

# Perf Report — registerRule.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00017ms |
| p50 | 0.00021ms |
| p95 | 0.00055ms |
| p99 | 0.0060ms |
| mean | 0.00044ms |
| stdev | 0.0016ms |
| min | 0.00013ms |
| max | 0.02ms |
| total | 0.09ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00017ms | 0.00017ms | -6.9e-7ms | -0.42% |
| p50 | 0.00021ms | 0.00021ms | -8.6e-7ms | -0.42% |
| p95 | 0.00055ms | 0.0024ms | -0.0018ms | -77.02% |
| p99 | 0.0060ms | 0.0058ms | +0.00015ms | +2.62% |
| mean | 0.00044ms | 0.00053ms | -0.000094ms | -17.81% |
| min | 0.00012ms | 0.00017ms | -0.000042ms | -25.01% |
| max | 0.02ms | 0.02ms | -0.00021ms | -1.05% |
| total | 0.09ms | 0.11ms | -0.02ms | -17.81% |

