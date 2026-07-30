# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.73ms | 1.37ms | 200ms | 0.00044ms | PASS | stable — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.42ms | 0.87ms | 200ms | 0.00045ms | PASS | stable (換算後 p10 +6% (閾値未満)、 p95 +32% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.86ms | 1.41ms | 200ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | cpu | 0.09ms | 0.11ms | 0.73ms | 7.910 | 8.519 | 0.64ms | 0.69ms |
| snapshot_batch (3 snapshot mode consecutive) | cpu | 0.09ms | 0.10ms | 0.42ms | 4.625 | 4.346 | 0.38ms | 0.35ms |
| mount_error_handling (3 throw + catch during render) | cpu | 0.09ms | 0.10ms | 0.86ms | 9.754 | 9.890 | 0.79ms | 0.80ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 2.76ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.56ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 5.16ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -114992 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 6568 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4477920 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.73ms |
| p50 | 0.99ms |
| p95 | 1.37ms |
| p99 | 1.57ms |
| mean | 1.01ms |
| stdev | 0.25ms |
| min | 0.68ms |
| max | 1.62ms |
| total | 20.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.874)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.64ms | 0.69ms | -0.05ms | -7.15% |
| p50 | 0.86ms | 0.81ms | +0.06ms | +6.94% |
| p95 | 1.20ms | 1.20ms | -0.0026ms | -0.22% |
| p99 | 1.37ms | 2.02ms | -0.65ms | -32.16% |
| mean | 0.88ms | 0.91ms | -0.02ms | -2.72% |
| min | 0.60ms | 0.62ms | -0.02ms | -3.03% |
| max | 1.41ms | 2.22ms | -0.81ms | -36.49% |
| total | 17.67ms | 18.16ms | -0.49ms | -2.72% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.42ms |
| p50 | 0.47ms |
| p95 | 0.87ms |
| p99 | 0.88ms |
| mean | 0.53ms |
| stdev | 0.15ms |
| min | 0.40ms |
| max | 0.88ms |
| total | 10.57ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.904)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.38ms | 0.35ms | +0.02ms | +6.42% |
| p50 | 0.42ms | 0.38ms | +0.04ms | +11.62% |
| p95 | 0.79ms | 0.59ms | +0.19ms | +32.47% |
| p99 | 0.79ms | 0.71ms | +0.09ms | +12.16% |
| mean | 0.48ms | 0.42ms | +0.06ms | +14.28% |
| min | 0.37ms | 0.35ms | +0.01ms | +3.61% |
| max | 0.79ms | 0.73ms | +0.06ms | +8.06% |
| total | 9.56ms | 8.36ms | +1.19ms | +14.28% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.86ms |
| p50 | 1.06ms |
| p95 | 1.41ms |
| p99 | 2.57ms |
| mean | 1.14ms |
| stdev | 0.44ms |
| min | 0.82ms |
| max | 2.86ms |
| total | 22.89ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.916)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.80ms | -0.01ms | -1.38% |
| p50 | 0.97ms | 0.87ms | +0.10ms | +11.99% |
| p95 | 1.29ms | 1.55ms | -0.26ms | -16.63% |
| p99 | 2.35ms | 4.24ms | -1.89ms | -44.58% |
| mean | 1.05ms | 1.11ms | -0.06ms | -5.18% |
| min | 0.75ms | 0.76ms | -0.0081ms | -1.07% |
| max | 2.62ms | 4.92ms | -2.30ms | -46.78% |
| total | 20.98ms | 22.12ms | -1.15ms | -5.18% |

