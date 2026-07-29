# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.66ms | 1.12ms | 200ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.34ms | 0.55ms | 200ms | 0.00051ms | PASS | stable (p10 +1% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.78ms | 1.26ms | 200ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.08ms | 0.66ms | 8.068 | 8.240 | 0.68ms | 0.70ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.08ms | 0.34ms | 4.212 | 4.183 | 0.34ms | 0.34ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.08ms | 0.78ms | 9.692 | 10.545 | 0.79ms | 0.86ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.37ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.71ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.30ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -117648 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 6616 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474568 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.66ms |
| p50 | 0.79ms |
| p95 | 1.12ms |
| p99 | 2.36ms |
| mean | 0.89ms |
| stdev | 0.43ms |
| min | 0.64ms |
| max | 2.66ms |
| total | 17.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.66ms | 0.70ms | -0.03ms | -4.66% |
| p50 | 0.79ms | 0.84ms | -0.05ms | -6.47% |
| p95 | 1.12ms | 1.50ms | -0.38ms | -25.13% |
| p99 | 2.36ms | 1.85ms | +0.50ms | +27.25% |
| mean | 0.89ms | 0.94ms | -0.05ms | -5.69% |
| min | 0.64ms | 0.64ms | +0.000083ms | +0.01% |
| max | 2.66ms | 1.94ms | +0.73ms | +37.39% |
| total | 17.72ms | 18.79ms | -1.07ms | -5.69% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.34ms |
| p50 | 0.39ms |
| p95 | 0.55ms |
| p99 | 0.57ms |
| mean | 0.41ms |
| stdev | 0.07ms |
| min | 0.32ms |
| max | 0.57ms |
| total | 8.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.34ms | 0.34ms | -0.0034ms | -0.99% |
| p50 | 0.39ms | 0.37ms | +0.03ms | +6.90% |
| p95 | 0.55ms | 0.44ms | +0.11ms | +25.64% |
| p99 | 0.57ms | 0.47ms | +0.10ms | +21.33% |
| mean | 0.41ms | 0.37ms | +0.03ms | +9.23% |
| min | 0.32ms | 0.33ms | -0.0070ms | -2.12% |
| max | 0.57ms | 0.47ms | +0.10ms | +20.33% |
| total | 8.11ms | 7.42ms | +0.69ms | +9.23% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.78ms |
| p50 | 0.85ms |
| p95 | 1.26ms |
| p99 | 2.27ms |
| mean | 0.96ms |
| stdev | 0.39ms |
| min | 0.76ms |
| max | 2.53ms |
| total | 19.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.78ms | 0.86ms | -0.08ms | -9.16% |
| p50 | 0.85ms | 0.96ms | -0.11ms | -11.33% |
| p95 | 1.26ms | 1.53ms | -0.27ms | -17.82% |
| p99 | 2.27ms | 5.11ms | -2.84ms | -55.52% |
| mean | 0.96ms | 1.25ms | -0.29ms | -23.15% |
| min | 0.76ms | 0.83ms | -0.08ms | -9.47% |
| max | 2.53ms | 6.01ms | -3.48ms | -57.92% |
| total | 19.19ms | 24.97ms | -5.78ms | -23.15% |

