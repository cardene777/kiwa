# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.0098ms | 0.04ms | 100ms | 0.00042ms | PASS | stable (p10 +2% (閾値未満)、 p95 +39% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.0045ms | 0.01ms | 100ms | 0.00042ms | PASS | stable (p10 +1% (閾値未満)、 p95 +140% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.0095ms | 0.08ms | 100ms | 0.00041ms | PASS | stable (p10 +3% (閾値未満)、 p95 +763% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | cpu | 0.08ms | 0.0098ms | 0.117 | 0.115 | 0.0099ms | 0.0097ms |
| signal_reactive_batch (5 signal+effect update chains) | cpu | 0.08ms | 0.0045ms | 0.054 | 0.054 | 0.0044ms | 0.0044ms |
| render_error_handling (5 throw + catch in component) | cpu | 0.08ms | 0.0095ms | 0.114 | 0.111 | 0.0093ms | 0.0090ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.28ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.22ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 15160 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 4864 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 5464 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0094ms |
| max | 0.05ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.0097ms | +0.000088ms | +0.91% |
| p50 | 0.01ms | 0.01ms | +0.0027ms | +24.81% |
| p95 | 0.04ms | 0.03ms | +0.0098ms | +37.19% |
| p99 | 0.05ms | 0.03ms | +0.02ms | +51.46% |
| mean | 0.02ms | 0.01ms | +0.0047ms | +34.78% |
| min | 0.0094ms | 0.0096ms | -0.00021ms | -2.17% |
| max | 0.05ms | 0.03ms | +0.02ms | +54.34% |
| total | 0.37ms | 0.27ms | +0.09ms | +34.78% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0045ms |
| p50 | 0.0065ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0068ms |
| stdev | 0.0028ms |
| min | 0.0044ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0044ms | +0.000087ms | +2.00% |
| p50 | 0.0065ms | 0.0045ms | +0.0020ms | +45.30% |
| p95 | 0.01ms | 0.0054ms | +0.0076ms | +141.31% |
| p99 | 0.01ms | 0.0055ms | +0.0080ms | +144.69% |
| mean | 0.0068ms | 0.0047ms | +0.0022ms | +46.20% |
| min | 0.0044ms | 0.0043ms | +0.000042ms | +0.97% |
| max | 0.01ms | 0.0056ms | +0.0081ms | +145.51% |
| total | 0.14ms | 0.09ms | +0.04ms | +46.20% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.02ms |
| p95 | 0.08ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.0092ms |
| max | 0.17ms |
| total | 0.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0090ms | +0.00046ms | +5.08% |
| p50 | 0.02ms | 0.0092ms | +0.01ms | +135.68% |
| p95 | 0.08ms | 0.0096ms | +0.07ms | +782.44% |
| p99 | 0.15ms | 0.0099ms | +0.14ms | +1452.32% |
| mean | 0.03ms | 0.0092ms | +0.02ms | +256.60% |
| min | 0.0092ms | 0.0088ms | +0.00033ms | +3.77% |
| max | 0.17ms | 0.01ms | +0.16ms | +1612.50% |
| total | 0.66ms | 0.18ms | +0.47ms | +256.60% |

