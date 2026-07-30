# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0066ms | 5ms | 0.00038ms | PASS | stable (検知には +0.00038ms (baseline 比 +103%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.01ms | 0.05ms | 5ms | 0.00038ms | PASS | stable (換算後 p10 -2% (閾値未満)、 p95 +52% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeServerFunction | cpu | 0.09ms | 0.12ms | 0.00042ms | 0.005 | 0.005 | 0.00039ms | 0.00038ms |
| invokeApiRoute | cpu | 0.09ms | 0.10ms | 0.01ms | 0.121 | 0.123 | 0.010ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.02ms | 10ms | PASS |
| invokeApiRoute | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | -3992 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 70608 B | 2200 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0066ms |
| p99 | 0.02ms |
| mean | 0.0014ms |
| stdev | 0.0041ms |
| min | 0.00042ms |
| max | 0.04ms |
| total | 0.28ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.924)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00039ms | 0.00038ms | +0.000010ms | +2.76% |
| p50 | 0.00042ms | 0.00042ms | +0.0000072ms | +1.72% |
| p95 | 0.0061ms | 0.0036ms | +0.0025ms | +69.03% |
| p99 | 0.02ms | 0.01ms | +0.0096ms | +72.56% |
| mean | 0.0013ms | 0.00093ms | +0.00038ms | +40.36% |
| min | 0.00038ms | 0.00038ms | +0.0000094ms | +2.52% |
| max | 0.03ms | 0.01ms | +0.02ms | +132.54% |
| total | 0.26ms | 0.19ms | +0.08ms | +40.36% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.12ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0098ms |
| max | 0.19ms |
| total | 3.97ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.917)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.010ms | 0.01ms | -0.00016ms | -1.58% |
| p50 | 0.01ms | 0.01ms | +0.00011ms | +1.00% |
| p95 | 0.05ms | 0.03ms | +0.02ms | +51.84% |
| p99 | 0.11ms | 0.08ms | +0.03ms | +39.63% |
| mean | 0.02ms | 0.02ms | +0.0026ms | +16.83% |
| min | 0.0090ms | 0.0093ms | -0.00028ms | -2.98% |
| max | 0.18ms | 0.14ms | +0.04ms | +30.17% |
| total | 3.64ms | 3.11ms | +0.52ms | +16.83% |

