# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.66ms | 1.28ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.38ms | 0.50ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.81ms | 1.10ms | 200ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.08ms | 0.10ms | 0.66ms | 7.986 | 8.519 | 0.65ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.08ms | 0.09ms | 0.38ms | 4.547 | 4.346 | 0.37ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.08ms | 0.11ms | 0.81ms | 9.742 | 9.890 | 0.79ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 3.73ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 1.91ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 4.27ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -125064 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -7824 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4475088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.66ms |
| p50 | 0.80ms |
| p95 | 1.28ms |
| p99 | 1.82ms |
| mean | 0.89ms |
| stdev | 0.30ms |
| min | 0.64ms |
| max | 1.95ms |
| total | 17.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.974)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.65ms | 0.69ms | -0.04ms | -6.26% |
| p50 | 0.78ms | 0.81ms | -0.03ms | -3.81% |
| p95 | 1.25ms | 1.20ms | +0.05ms | +3.89% |
| p99 | 1.77ms | 2.02ms | -0.25ms | -12.29% |
| mean | 0.87ms | 0.91ms | -0.04ms | -4.59% |
| min | 0.63ms | 0.62ms | +0.01ms | +1.72% |
| max | 1.90ms | 2.22ms | -0.32ms | -14.49% |
| total | 17.33ms | 18.16ms | -0.83ms | -4.59% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.38ms |
| p50 | 0.40ms |
| p95 | 0.50ms |
| p99 | 0.90ms |
| mean | 0.44ms |
| stdev | 0.14ms |
| min | 0.37ms |
| max | 1.00ms |
| total | 8.84ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.985)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.37ms | 0.35ms | +0.02ms | +4.62% |
| p50 | 0.40ms | 0.38ms | +0.02ms | +4.98% |
| p95 | 0.50ms | 0.59ms | -0.10ms | -16.11% |
| p99 | 0.89ms | 0.71ms | +0.18ms | +25.89% |
| mean | 0.44ms | 0.42ms | +0.02ms | +4.15% |
| min | 0.36ms | 0.35ms | +0.0083ms | +2.36% |
| max | 0.99ms | 0.73ms | +0.25ms | +34.36% |
| total | 8.71ms | 8.36ms | +0.35ms | +4.15% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.81ms |
| p50 | 0.87ms |
| p95 | 1.10ms |
| p99 | 3.02ms |
| mean | 1.01ms |
| stdev | 0.59ms |
| min | 0.77ms |
| max | 3.50ms |
| total | 20.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.80ms | -0.01ms | -1.49% |
| p50 | 0.85ms | 0.87ms | -0.02ms | -2.34% |
| p95 | 1.07ms | 1.55ms | -0.48ms | -30.97% |
| p99 | 2.94ms | 4.24ms | -1.30ms | -30.72% |
| mean | 0.98ms | 1.11ms | -0.12ms | -11.03% |
| min | 0.75ms | 0.76ms | -0.0036ms | -0.48% |
| max | 3.41ms | 4.92ms | -1.51ms | -30.70% |
| total | 19.68ms | 22.12ms | -2.44ms | -11.03% |

