# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.65ms | 1.23ms | 200ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.35ms | 0.65ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.74ms | 1.55ms | 200ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.08ms | 0.11ms | 0.65ms | 7.798 | 8.519 | 0.63ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.08ms | 0.09ms | 0.35ms | 4.283 | 4.346 | 0.35ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.08ms | 0.09ms | 0.74ms | 9.229 | 9.890 | 0.75ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 5.61ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.38ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 5.14ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -114488 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -9368 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4470744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.65ms |
| p50 | 0.82ms |
| p95 | 1.23ms |
| p99 | 2.11ms |
| mean | 0.91ms |
| stdev | 0.37ms |
| min | 0.59ms |
| max | 2.33ms |
| total | 18.13ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.968)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.63ms | 0.69ms | -0.06ms | -8.46% |
| p50 | 0.79ms | 0.81ms | -0.01ms | -1.80% |
| p95 | 1.19ms | 1.20ms | -0.01ms | -1.11% |
| p99 | 2.05ms | 2.02ms | +0.02ms | +1.24% |
| mean | 0.88ms | 0.91ms | -0.03ms | -3.42% |
| min | 0.57ms | 0.62ms | -0.05ms | -8.12% |
| max | 2.26ms | 2.22ms | +0.03ms | +1.55% |
| total | 17.54ms | 18.16ms | -0.62ms | -3.42% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.35ms |
| p50 | 0.41ms |
| p95 | 0.65ms |
| p99 | 0.66ms |
| mean | 0.43ms |
| stdev | 0.09ms |
| min | 0.33ms |
| max | 0.66ms |
| total | 8.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.004)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.35ms | 0.35ms | -0.0052ms | -1.46% |
| p50 | 0.41ms | 0.38ms | +0.03ms | +8.48% |
| p95 | 0.65ms | 0.59ms | +0.06ms | +9.44% |
| p99 | 0.66ms | 0.71ms | -0.04ms | -6.11% |
| mean | 0.43ms | 0.42ms | +0.01ms | +2.54% |
| min | 0.34ms | 0.35ms | -0.02ms | -4.94% |
| max | 0.67ms | 0.73ms | -0.07ms | -9.24% |
| total | 8.57ms | 8.36ms | +0.21ms | +2.54% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.74ms |
| p50 | 0.93ms |
| p95 | 1.55ms |
| p99 | 2.34ms |
| mean | 1.01ms |
| stdev | 0.40ms |
| min | 0.72ms |
| max | 2.53ms |
| total | 20.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.007)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.80ms | -0.05ms | -6.68% |
| p50 | 0.93ms | 0.87ms | +0.06ms | +7.41% |
| p95 | 1.57ms | 1.55ms | +0.01ms | +0.94% |
| p99 | 2.35ms | 4.24ms | -1.89ms | -44.58% |
| mean | 1.02ms | 1.11ms | -0.08ms | -7.63% |
| min | 0.72ms | 0.76ms | -0.03ms | -4.33% |
| max | 2.55ms | 4.92ms | -2.37ms | -48.17% |
| total | 20.43ms | 22.12ms | -1.69ms | -7.63% |

