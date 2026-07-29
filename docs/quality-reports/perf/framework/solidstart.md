# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerFunction | 0.00042ms | 0.0023ms | 5ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeApiRoute | 0.01ms | 0.15ms | 5ms | 0.00033ms | PASS | stable (p10 +7% (閾値未満)、 p95 +93% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| invokeServerFunction | cpu | 0.08ms | 0.00042ms | 0.005 | 0.005 | 0.00042ms | 0.00042ms |
| invokeApiRoute | cpu | 0.08ms | 0.01ms | 0.130 | 0.122 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.02ms | 10ms | PASS |
| invokeApiRoute | 0.14ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerFunction | 294520 B | 0 B | 102400 B | yes | PASS |
| invokeApiRoute | 2632 B | -22 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0023ms |
| p99 | 0.0061ms |
| mean | 0.00080ms |
| stdev | 0.0014ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p50 | 0.00046ms | 0.00050ms | -0.000042ms | -8.40% |
| p95 | 0.0023ms | 0.01ms | -0.0092ms | -79.78% |
| p99 | 0.0061ms | 0.02ms | -0.01ms | -68.92% |
| mean | 0.00080ms | 0.0041ms | -0.0033ms | -80.46% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.40ms | -0.39ms | -97.06% |
| total | 0.16ms | 0.81ms | -0.66ms | -80.46% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.15ms |
| p99 | 0.26ms |
| mean | 0.05ms |
| stdev | 0.07ms |
| min | 0.0095ms |
| max | 0.56ms |
| total | 9.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00063ms | +6.18% |
| p50 | 0.02ms | 0.01ms | +0.0057ms | +44.66% |
| p95 | 0.15ms | 0.08ms | +0.07ms | +91.70% |
| p99 | 0.26ms | 0.24ms | +0.03ms | +10.95% |
| mean | 0.05ms | 0.03ms | +0.02ms | +81.81% |
| min | 0.0095ms | 0.0092ms | +0.00038ms | +4.09% |
| max | 0.56ms | 0.27ms | +0.29ms | +109.99% |
| total | 9.25ms | 5.09ms | +4.16ms | +81.81% |

