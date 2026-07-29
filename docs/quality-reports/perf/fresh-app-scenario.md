# Perf Suite — fresh-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.13ms | 0.17ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| island_mount_batch (5 mountIsland with different props) | 0.0099ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 +4% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.05ms | 0.05ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | cpu | 0.08ms | 0.13ms | 1.594 | 1.580 | 0.13ms | 0.13ms |
| island_mount_batch (5 mountIsland with different props) | cpu | 0.08ms | 0.0099ms | 0.122 | 0.117 | 0.0098ms | 0.0094ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.05ms | 0.566 | 0.565 | 0.05ms | 0.05ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 0.65ms | 200ms | PASS |
| island_mount_batch (5 mountIsland with different props) | 0.05ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.28ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| handler_workflow (10 invokeFreshHandler GET+POST mix) | 57784 B | 2800 B | 102400 B | yes | PASS |
| island_mount_batch (5 mountIsland with different props) | 22384 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | -4376 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.15ms |
| stdev | 0.01ms |
| min | 0.13ms |
| max | 0.17ms |
| total | 2.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.13ms | 0.13ms | -0.00032ms | -0.24% |
| p50 | 0.14ms | 0.18ms | -0.03ms | -19.52% |
| p95 | 0.17ms | 0.67ms | -0.51ms | -75.22% |
| p99 | 0.17ms | 0.74ms | -0.57ms | -76.91% |
| mean | 0.15ms | 0.29ms | -0.15ms | -50.72% |
| min | 0.13ms | 0.12ms | +0.0047ms | +3.75% |
| max | 0.17ms | 0.76ms | -0.59ms | -77.29% |
| total | 2.90ms | 5.89ms | -2.99ms | -50.72% |

### island_mount_batch (5 mountIsland with different props)

# Perf Report — island_mount_batch (5 mountIsland with different props).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0037ms |
| min | 0.0098ms |
| max | 0.03ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0094ms | +0.00052ms | +5.52% |
| p50 | 0.01ms | 0.0095ms | +0.0014ms | +15.07% |
| p95 | 0.02ms | 0.01ms | +0.0036ms | +29.58% |
| p99 | 0.02ms | 0.02ms | +0.0045ms | +22.66% |
| mean | 0.01ms | 0.01ms | +0.0016ms | +15.53% |
| min | 0.0098ms | 0.0092ms | +0.00067ms | +7.27% |
| max | 0.03ms | 0.02ms | +0.0047ms | +21.69% |
| total | 0.24ms | 0.21ms | +0.03ms | +15.53% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.05ms |
| p99 | 0.05ms |
| mean | 0.05ms |
| stdev | 0.00088ms |
| min | 0.05ms |
| max | 0.05ms |
| total | 0.94ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00044ms | -0.95% |
| p50 | 0.05ms | 0.05ms | -0.00077ms | -1.62% |
| p95 | 0.05ms | 0.06ms | -0.01ms | -17.85% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -54.80% |
| mean | 0.05ms | 0.05ms | -0.0054ms | -10.35% |
| min | 0.05ms | 0.05ms | -0.00063ms | -1.36% |
| max | 0.05ms | 0.12ms | -0.07ms | -59.25% |
| total | 0.94ms | 1.04ms | -0.11ms | -10.35% |

