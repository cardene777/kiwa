# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.13ms | 0.17ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.01ms | 0.03ms | 100ms | 0.00051ms | PASS | stable (換算後 p10 +15% (閾値未満)、 p95 +126% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.33ms | 100ms | 0.00049ms | PASS | stable (換算後 p10 +4% (閾値未満)、 p95 +416% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | cpu | 0.08ms | 0.09ms | 0.13ms | 1.562 | 1.474 | 0.13ms | 0.12ms |
| island_mount_batch (5 mountIsland with different props) | cpu | 0.08ms | 0.10ms | 0.01ms | 0.136 | 0.118 | 0.01ms | 0.0098ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.12ms | 0.05ms | 0.589 | 0.569 | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 1.13ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.06ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.25ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 44088 B | 2800 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | -80400 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -3912 B | -483 B | 102400 B | yes | PASS |

## Detailed serial reports

### handler_workflow (10 invokeFreshHandler GET+POST mix)

# Perf Report — handler_workflow (10 invokeFreshHandler GET+POST mix).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.13ms |
| p50 | 0.14ms |
| p95 | 0.17ms |
| p99 | 0.17ms |
| mean | 0.14ms |
| stdev | 0.02ms |
| min | 0.12ms |
| max | 0.17ms |
| total | 2.88ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.973)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.12ms | +0.0071ms | +5.96% |
| p50 | 0.14ms | 0.14ms | -0.00015ms | -0.11% |
| p95 | 0.17ms | 0.16ms | +0.01ms | +7.63% |
| p99 | 0.17ms | 0.16ms | +0.0080ms | +4.98% |
| mean | 0.14ms | 0.14ms | +0.0032ms | +2.32% |
| min | 0.12ms | 0.11ms | +0.0050ms | +4.33% |
| max | 0.17ms | 0.16ms | +0.0070ms | +4.34% |
| total | 2.81ms | 2.74ms | +0.06ms | +2.32% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0089ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.33ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.012)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.0098ms | +0.0015ms | +14.92% |
| p50 | 0.01ms | 0.01ms | +0.0026ms | +25.19% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +126.01% |
| p99 | 0.04ms | 0.02ms | +0.03ms | +162.52% |
| mean | 0.02ms | 0.01ms | +0.0060ms | +55.91% |
| min | 0.01ms | 0.0097ms | +0.0014ms | +14.21% |
| max | 0.05ms | 0.02ms | +0.03ms | +169.22% |
| total | 0.33ms | 0.21ms | +0.12ms | +55.91% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.33ms |
| p99 | 0.39ms |
| mean | 0.09ms |
| stdev | 0.10ms |
| min | 0.05ms |
| max | 0.41ms |
| total | 1.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.970)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.0017ms | +3.63% |
| p50 | 0.05ms | 0.05ms | +0.0038ms | +8.09% |
| p95 | 0.32ms | 0.06ms | +0.25ms | +415.95% |
| p99 | 0.38ms | 0.14ms | +0.24ms | +177.94% |
| mean | 0.09ms | 0.05ms | +0.04ms | +68.96% |
| min | 0.05ms | 0.05ms | +0.0011ms | +2.35% |
| max | 0.40ms | 0.16ms | +0.24ms | +154.45% |
| total | 1.80ms | 1.07ms | +0.74ms | +68.96% |

