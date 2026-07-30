# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 1.92ms | 2.77ms | 500ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.50ms | 0.73ms | 300ms | 0.00037ms | PASS | stable — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.59ms | 0.87ms | 500ms | 0.00046ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | fs-write | 0.14ms | 0.39ms | 1.92ms | 13.586 | 13.022 | 1.84ms | 1.76ms |
| spec_to_test_batch (5 consecutive runSpecToTest) | fs-write | 0.10ms | 0.33ms | 0.50ms | 4.890 | 5.493 | 0.36ms | 0.41ms |
| init_error_handling (3 InitConflictError catch) | fs-write | 0.12ms | 0.31ms | 0.59ms | 4.951 | 6.201 | 0.55ms | 0.68ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 11.10ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.82ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 3.57ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 520 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -2424 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 1.92ms |
| p50 | 2.13ms |
| p95 | 2.77ms |
| p99 | 2.81ms |
| mean | 2.24ms |
| stdev | 0.30ms |
| min | 1.82ms |
| max | 2.82ms |
| total | 44.86ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.954)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.84ms | 1.76ms | +0.08ms | +4.33% |
| p50 | 2.03ms | 2.03ms | +0.00027ms | +0.01% |
| p95 | 2.65ms | 2.64ms | +0.0045ms | +0.17% |
| p99 | 2.68ms | 2.74ms | -0.06ms | -2.06% |
| mean | 2.14ms | 2.09ms | +0.05ms | +2.22% |
| min | 1.73ms | 1.54ms | +0.19ms | +12.35% |
| max | 2.69ms | 2.77ms | -0.07ms | -2.59% |
| total | 42.79ms | 41.86ms | +0.93ms | +2.22% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.50ms |
| p50 | 0.61ms |
| p95 | 0.73ms |
| p99 | 0.77ms |
| mean | 0.61ms |
| stdev | 0.09ms |
| min | 0.45ms |
| max | 0.78ms |
| total | 12.29ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.733)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.41ms | -0.04ms | -10.98% |
| p50 | 0.45ms | 0.47ms | -0.03ms | -5.58% |
| p95 | 0.53ms | 0.56ms | -0.03ms | -5.34% |
| p99 | 0.57ms | 0.59ms | -0.02ms | -3.53% |
| mean | 0.45ms | 0.48ms | -0.03ms | -5.58% |
| min | 0.33ms | 0.40ms | -0.07ms | -18.68% |
| max | 0.57ms | 0.59ms | -0.02ms | -3.11% |
| total | 9.01ms | 9.54ms | -0.53ms | -5.58% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.59ms |
| p50 | 0.73ms |
| p95 | 0.87ms |
| p99 | 0.89ms |
| mean | 0.72ms |
| stdev | 0.10ms |
| min | 0.57ms |
| max | 0.89ms |
| total | 14.48ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.55ms | 0.68ms | -0.14ms | -20.16% |
| p50 | 0.67ms | 0.72ms | -0.05ms | -7.59% |
| p95 | 0.80ms | 0.95ms | -0.14ms | -15.27% |
| p99 | 0.82ms | 0.96ms | -0.14ms | -14.35% |
| mean | 0.67ms | 0.76ms | -0.09ms | -11.62% |
| min | 0.52ms | 0.65ms | -0.13ms | -19.82% |
| max | 0.82ms | 0.96ms | -0.14ms | -14.12% |
| total | 13.35ms | 15.10ms | -1.76ms | -11.62% |

