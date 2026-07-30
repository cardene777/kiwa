# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.66ms | 1.26ms | 200ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.35ms | 0.49ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.77ms | 1.12ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.08ms | 0.09ms | 0.66ms | 7.851 | 8.519 | 0.64ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.08ms | 0.09ms | 0.35ms | 4.327 | 4.346 | 0.35ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.08ms | 0.09ms | 0.77ms | 9.500 | 9.890 | 0.77ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.50ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.46ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.36ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -116800 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -8984 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4474960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.66ms |
| p50 | 0.70ms |
| p95 | 1.26ms |
| p99 | 1.78ms |
| mean | 0.82ms |
| stdev | 0.30ms |
| min | 0.59ms |
| max | 1.91ms |
| total | 16.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.969)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.64ms | 0.69ms | -0.05ms | -7.85% |
| p50 | 0.68ms | 0.81ms | -0.13ms | -16.12% |
| p95 | 1.22ms | 1.20ms | +0.02ms | +1.51% |
| p99 | 1.72ms | 2.02ms | -0.30ms | -14.70% |
| mean | 0.79ms | 0.91ms | -0.12ms | -12.68% |
| min | 0.57ms | 0.62ms | -0.05ms | -7.79% |
| max | 1.85ms | 2.22ms | -0.38ms | -16.90% |
| total | 15.86ms | 18.16ms | -2.30ms | -12.68% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.41ms |
| p95 | 0.49ms |
| p99 | 0.80ms |
| mean | 0.43ms |
| stdev | 0.11ms |
| min | 0.34ms |
| max | 0.88ms |
| total | 8.61ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.998)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.35ms | -0.0015ms | -0.43% |
| p50 | 0.41ms | 0.38ms | +0.03ms | +8.65% |
| p95 | 0.49ms | 0.59ms | -0.10ms | -16.77% |
| p99 | 0.80ms | 0.71ms | +0.10ms | +13.59% |
| mean | 0.43ms | 0.42ms | +0.01ms | +2.78% |
| min | 0.34ms | 0.35ms | -0.02ms | -4.96% |
| max | 0.88ms | 0.73ms | +0.14ms | +19.71% |
| total | 8.59ms | 8.36ms | +0.23ms | +2.78% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.77ms |
| p50 | 0.83ms |
| p95 | 1.12ms |
| p99 | 2.13ms |
| mean | 0.92ms |
| stdev | 0.35ms |
| min | 0.74ms |
| max | 2.38ms |
| total | 18.37ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.002)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.77ms | 0.80ms | -0.03ms | -3.94% |
| p50 | 0.83ms | 0.87ms | -0.04ms | -4.24% |
| p95 | 1.13ms | 1.55ms | -0.43ms | -27.44% |
| p99 | 2.13ms | 4.24ms | -2.11ms | -49.73% |
| mean | 0.92ms | 1.11ms | -0.19ms | -16.83% |
| min | 0.74ms | 0.76ms | -0.01ms | -1.93% |
| max | 2.39ms | 4.92ms | -2.53ms | -51.49% |
| total | 18.40ms | 22.12ms | -3.72ms | -16.83% |

