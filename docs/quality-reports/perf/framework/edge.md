# Perf Suite — edge

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeEdgeHandler | 0.0089ms | 0.04ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEdgeHandlerWithKv | 0.0067ms | 0.01ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 -1% (閾値未満)、 p95 +54% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeEdgeHandler | cpu | 0.08ms | 0.09ms | 0.0089ms | 0.107 | 0.107 | 0.0086ms | 0.0086ms |
| invokeEdgeHandlerWithKv | cpu | 0.08ms | 0.09ms | 0.0067ms | 0.083 | 0.083 | 0.0066ms | 0.0067ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEdgeHandler | 0.14ms | 10ms | PASS |
| invokeEdgeHandlerWithKv | 0.07ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeEdgeHandler | 20840 B | -8952 B | 102400 B | yes | PASS |
| invokeEdgeHandlerWithKv | 648 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeEdgeHandler

# Perf Report — invokeEdgeHandler.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0089ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0080ms |
| max | 0.11ms |
| total | 2.96ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.965)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0086ms | -0.000012ms | -0.14% |
| p50 | 0.01ms | 0.0099ms | +0.00018ms | +1.81% |
| p95 | 0.03ms | 0.03ms | +0.0037ms | +12.09% |
| p99 | 0.09ms | 0.09ms | +0.0056ms | +6.45% |
| mean | 0.01ms | 0.01ms | +0.00050ms | +3.59% |
| min | 0.0078ms | 0.0076ms | +0.00014ms | +1.80% |
| max | 0.11ms | 0.10ms | +0.01ms | +10.18% |
| total | 2.86ms | 2.76ms | +0.10ms | +3.59% |

### invokeEdgeHandlerWithKv

# Perf Report — invokeEdgeHandlerWithKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0067ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.05ms |
| mean | 0.0093ms |
| stdev | 0.01ms |
| min | 0.0065ms |
| max | 0.12ms |
| total | 1.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.995)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0067ms | -0.000035ms | -0.52% |
| p50 | 0.0070ms | 0.0070ms | +0.0000056ms | +0.08% |
| p95 | 0.01ms | 0.0091ms | +0.0050ms | +54.36% |
| p99 | 0.05ms | 0.01ms | +0.04ms | +267.06% |
| mean | 0.0093ms | 0.0074ms | +0.0019ms | +25.50% |
| min | 0.0065ms | 0.0064ms | +0.000050ms | +0.79% |
| max | 0.12ms | 0.02ms | +0.09ms | +451.70% |
| total | 1.85ms | 1.48ms | +0.38ms | +25.50% |

