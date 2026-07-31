# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.70ms | 1.25ms | 200ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.39ms | 0.51ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.81ms | 1.75ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.09ms | 0.10ms | 0.70ms | 8.170 | 8.519 | 0.66ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.08ms | 0.09ms | 0.39ms | 4.707 | 4.346 | 0.38ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.08ms | 0.10ms | 0.81ms | 9.753 | 9.890 | 0.79ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.31ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.10ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 3.52ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -117296 B | -933 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -6360 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4473896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.70ms |
| p50 | 0.81ms |
| p95 | 1.25ms |
| p99 | 2.43ms |
| mean | 0.93ms |
| stdev | 0.44ms |
| min | 0.65ms |
| max | 2.73ms |
| total | 18.63ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.945)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.66ms | 0.69ms | -0.03ms | -4.10% |
| p50 | 0.77ms | 0.81ms | -0.04ms | -5.05% |
| p95 | 1.18ms | 1.20ms | -0.02ms | -1.87% |
| p99 | 2.30ms | 2.02ms | +0.28ms | +13.84% |
| mean | 0.88ms | 0.91ms | -0.03ms | -3.12% |
| min | 0.62ms | 0.62ms | -0.0013ms | -0.20% |
| max | 2.58ms | 2.22ms | +0.36ms | +15.96% |
| total | 17.59ms | 18.16ms | -0.57ms | -3.12% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.39ms |
| p50 | 0.42ms |
| p95 | 0.51ms |
| p99 | 0.51ms |
| mean | 0.43ms |
| stdev | 0.05ms |
| min | 0.34ms |
| max | 0.51ms |
| total | 8.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.35ms | +0.03ms | +8.32% |
| p50 | 0.41ms | 0.38ms | +0.04ms | +9.42% |
| p95 | 0.50ms | 0.59ms | -0.09ms | -15.38% |
| p99 | 0.50ms | 0.71ms | -0.20ms | -28.89% |
| mean | 0.42ms | 0.42ms | +0.0048ms | +1.14% |
| min | 0.34ms | 0.35ms | -0.01ms | -4.15% |
| max | 0.50ms | 0.73ms | -0.23ms | -31.61% |
| total | 8.46ms | 8.36ms | +0.10ms | +1.14% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.81ms |
| p50 | 1.02ms |
| p95 | 1.75ms |
| p99 | 3.06ms |
| mean | 1.12ms |
| stdev | 0.57ms |
| min | 0.74ms |
| max | 3.39ms |
| total | 22.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.972)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.80ms | -0.01ms | -1.38% |
| p50 | 0.99ms | 0.87ms | +0.13ms | +14.38% |
| p95 | 1.70ms | 1.55ms | +0.14ms | +9.33% |
| p99 | 2.98ms | 4.24ms | -1.27ms | -29.89% |
| mean | 1.09ms | 1.11ms | -0.01ms | -1.22% |
| min | 0.72ms | 0.76ms | -0.04ms | -5.35% |
| max | 3.30ms | 4.92ms | -1.62ms | -32.98% |
| total | 21.85ms | 22.12ms | -0.27ms | -1.22% |

