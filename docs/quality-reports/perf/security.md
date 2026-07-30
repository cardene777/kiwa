# Perf Suite — security

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| buildCspHeader | 0.0040ms | 0.01ms | 5ms | 0.00030ms | PASS | stable (換算後 p10 +11% (閾値未満)、 p95 +44% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| validateNonce | 0.00021ms | 0.0028ms | 5ms | 0.00030ms | PASS | stable (検知には +0.00030ms (baseline 比 +143%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| buildCspHeader | cpu | 0.09ms | 0.11ms | 0.0040ms | 0.044 | 0.040 | 0.0035ms | 0.0032ms |
| validateNonce | cpu | 0.09ms | 0.11ms | 0.00021ms | 0.002 | 0.003 | 0.00019ms | 0.00021ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| buildCspHeader | 0.05ms | 10ms | PASS |
| validateNonce | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| buildCspHeader | -432 B | 0 B | 102400 B | yes | PASS |
| validateNonce | -2640 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### buildCspHeader

# Perf Report — buildCspHeader.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0040ms |
| p50 | 0.0057ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.0066ms |
| stdev | 0.0057ms |
| min | 0.0028ms |
| max | 0.07ms |
| total | 1.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.887)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0032ms | +0.00034ms | +10.68% |
| p50 | 0.0050ms | 0.0045ms | +0.00049ms | +10.73% |
| p95 | 0.01ms | 0.0082ms | +0.0036ms | +43.96% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +72.71% |
| mean | 0.0059ms | 0.0049ms | +0.00097ms | +19.68% |
| min | 0.0025ms | 0.0024ms | +0.000098ms | +4.06% |
| max | 0.06ms | 0.02ms | +0.04ms | +192.39% |
| total | 1.18ms | 0.98ms | +0.19ms | +19.68% |

### validateNonce

# Perf Report — validateNonce.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00021ms |
| p50 | 0.00025ms |
| p95 | 0.0028ms |
| p99 | 0.0059ms |
| mean | 0.00069ms |
| stdev | 0.0019ms |
| min | 0.00021ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.889)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00019ms | 0.00021ms | -0.000022ms | -10.70% |
| p50 | 0.00022ms | 0.00021ms | +0.000013ms | +6.30% |
| p95 | 0.0025ms | 0.00071ms | +0.0018ms | +248.94% |
| p99 | 0.0052ms | 0.0033ms | +0.0020ms | +60.48% |
| mean | 0.00062ms | 0.00034ms | +0.00028ms | +82.36% |
| min | 0.00018ms | 0.00017ms | +0.000019ms | +11.35% |
| max | 0.02ms | 0.0048ms | +0.01ms | +276.18% |
| total | 0.12ms | 0.07ms | +0.06ms | +82.36% |

