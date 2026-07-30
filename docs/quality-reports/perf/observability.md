# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0051ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00025ms | 0.0077ms | 5ms | 0.00032ms | PASS | stable (検知には +0.00032ms (baseline 比 +155%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0062ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| collectRunHistory | cpu | 0.08ms | 0.08ms | 0.02ms | 0.205 | 0.190 | 0.02ms | 0.02ms |
| detectFlaky | cpu | 0.08ms | 0.08ms | 0.0051ms | 0.064 | 0.059 | 0.0051ms | 0.0047ms |
| checkThresholds | cpu | 0.08ms | 0.15ms | 0.00025ms | 0.003 | 0.003 | 0.00024ms | 0.00021ms |
| renderDashboard | cpu | 0.08ms | 0.09ms | 0.0018ms | 0.022 | 0.022 | 0.0018ms | 0.0018ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.22ms | 10ms | PASS |
| detectFlaky | 0.07ms | 10ms | PASS |
| checkThresholds | 0.02ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | 3984 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -7864 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 1768 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 552 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.01ms |
| max | 0.54ms |
| total | 4.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.980)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0012ms | +7.94% |
| p50 | 0.02ms | 0.02ms | +0.000037ms | +0.22% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.16% |
| p99 | 0.04ms | 0.05ms | -0.01ms | -21.72% |
| mean | 0.02ms | 0.02ms | +0.00035ms | +1.68% |
| min | 0.01ms | 0.01ms | -0.00018ms | -1.21% |
| max | 0.53ms | 0.36ms | +0.17ms | +49.16% |
| total | 4.21ms | 4.14ms | +0.07ms | +1.68% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0054ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0063ms |
| stdev | 0.0030ms |
| min | 0.0050ms |
| max | 0.02ms |
| total | 1.25ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0047ms | +0.00041ms | +8.79% |
| p50 | 0.0053ms | 0.0048ms | +0.00053ms | +11.14% |
| p95 | 0.01ms | 0.01ms | +0.00020ms | +1.37% |
| p99 | 0.02ms | 0.02ms | -0.00099ms | -5.31% |
| mean | 0.0062ms | 0.0058ms | +0.00042ms | +7.35% |
| min | 0.0050ms | 0.0046ms | +0.00033ms | +7.10% |
| max | 0.02ms | 0.03ms | -0.0068ms | -23.07% |
| total | 1.24ms | 1.15ms | +0.08ms | +7.35% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00025ms |
| p50 | 0.00042ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0015ms |
| stdev | 0.0045ms |
| min | 0.00021ms |
| max | 0.05ms |
| total | 0.31ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.974)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00024ms | 0.00021ms | +0.000034ms | +16.46% |
| p50 | 0.00041ms | 0.00038ms | +0.000031ms | +8.27% |
| p95 | 0.0075ms | 0.0011ms | +0.0064ms | +588.65% |
| p99 | 0.01ms | 0.0067ms | +0.0061ms | +92.38% |
| mean | 0.0015ms | 0.00065ms | +0.00086ms | +132.74% |
| min | 0.00020ms | 0.00017ms | +0.000037ms | +22.00% |
| max | 0.05ms | 0.02ms | +0.03ms | +184.33% |
| total | 0.30ms | 0.13ms | +0.17ms | +132.74% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0062ms |
| p99 | 0.01ms |
| mean | 0.0025ms |
| stdev | 0.0023ms |
| min | 0.0017ms |
| max | 0.02ms |
| total | 0.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.989)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0018ms | -0.000015ms | -0.84% |
| p50 | 0.0019ms | 0.0018ms | +0.000061ms | +3.35% |
| p95 | 0.0061ms | 0.0062ms | -0.00010ms | -1.64% |
| p99 | 0.01ms | 0.02ms | -0.0029ms | -17.00% |
| mean | 0.0025ms | 0.0024ms | +0.000063ms | +2.59% |
| min | 0.0017ms | 0.0017ms | -0.000018ms | -1.06% |
| max | 0.02ms | 0.02ms | +0.0039ms | +21.51% |
| total | 0.50ms | 0.49ms | +0.01ms | +2.59% |

