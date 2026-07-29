# Perf Suite — cli-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 2.16ms | 5.03ms | 500ms | 0.00045ms | PASS | stable (p10 -13% (閾値未満)、 p95 +58% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| spec_to_test_batch (5 consecutive runSpecToTest) | 0.50ms | 1.49ms | 300ms | 0.00046ms | PASS | stable (p10 -9% (閾値未満)、 p95 +76% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| init_error_handling (3 InitConflictError catch) | 0.89ms | 2.59ms | 500ms | 0.00021ms | PASS | improved — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | fs-write | 0.16ms | 2.16ms | 13.638 | 15.703 | 1.69ms | 1.95ms |
| spec_to_test_batch (5 consecutive runSpecToTest) | fs-write | 0.10ms | 0.50ms | 4.872 | 5.354 | 0.40ms | 0.44ms |
| init_error_handling (3 InitConflictError catch) | fs-write | 0.34ms | 0.89ms | 2.660 | 5.390 | 0.33ms | 0.68ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 21.09ms | 1000ms | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | 2.72ms | 600ms | PASS |
| init_error_handling (3 InitConflictError catch) | 5.84ms | 1000ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| init_workflow (3 fresh project scaffold) | 3912 B | 0 B | 102400 B | yes | PASS |
| spec_to_test_batch (5 consecutive runSpecToTest) | -1608 B | 0 B | 102400 B | yes | PASS |
| init_error_handling (3 InitConflictError catch) | 5352 B | -10592 B | 102400 B | yes | PASS |

## Detailed serial reports

### init_workflow (3 fresh project scaffold)

# Perf Report — init_workflow (3 fresh project scaffold).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 2.16ms |
| p50 | 2.39ms |
| p95 | 5.03ms |
| p99 | 5.71ms |
| mean | 2.69ms |
| stdev | 0.97ms |
| min | 1.91ms |
| max | 5.88ms |
| total | 53.86ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 2.16ms | 1.95ms | +0.21ms | +10.95% |
| p50 | 2.39ms | 2.11ms | +0.28ms | +13.12% |
| p95 | 5.03ms | 2.49ms | +2.54ms | +101.84% |
| p99 | 5.71ms | 2.66ms | +3.06ms | +115.12% |
| mean | 2.69ms | 2.18ms | +0.51ms | +23.56% |
| min | 1.91ms | 1.79ms | +0.12ms | +6.52% |
| max | 5.88ms | 2.70ms | +3.19ms | +118.19% |
| total | 53.86ms | 43.59ms | +10.27ms | +23.56% |

### spec_to_test_batch (5 consecutive runSpecToTest)

# Perf Report — spec_to_test_batch (5 consecutive runSpecToTest).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.50ms |
| p50 | 0.69ms |
| p95 | 1.49ms |
| p99 | 1.62ms |
| mean | 0.76ms |
| stdev | 0.34ms |
| min | 0.49ms |
| max | 1.65ms |
| total | 15.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.50ms | 0.44ms | +0.06ms | +13.53% |
| p50 | 0.69ms | 0.53ms | +0.16ms | +29.64% |
| p95 | 1.49ms | 0.68ms | +0.81ms | +120.12% |
| p99 | 1.62ms | 0.81ms | +0.81ms | +100.53% |
| mean | 0.76ms | 0.54ms | +0.22ms | +41.12% |
| min | 0.49ms | 0.44ms | +0.05ms | +11.05% |
| max | 1.65ms | 0.84ms | +0.81ms | +96.58% |
| total | 15.30ms | 10.84ms | +4.46ms | +41.12% |

### init_error_handling (3 InitConflictError catch)

# Perf Report — init_error_handling (3 InitConflictError catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.89ms |
| p50 | 1.17ms |
| p95 | 2.59ms |
| p99 | 2.97ms |
| mean | 1.42ms |
| stdev | 0.61ms |
| min | 0.86ms |
| max | 3.06ms |
| total | 28.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.89ms | 0.68ms | +0.22ms | +32.31% |
| p50 | 1.17ms | 0.74ms | +0.43ms | +57.98% |
| p95 | 2.59ms | 0.90ms | +1.70ms | +188.66% |
| p99 | 2.97ms | 0.93ms | +2.04ms | +219.03% |
| mean | 1.42ms | 0.76ms | +0.65ms | +85.83% |
| min | 0.86ms | 0.64ms | +0.23ms | +35.94% |
| max | 3.06ms | 0.94ms | +2.12ms | +226.30% |
| total | 28.34ms | 15.25ms | +13.09ms | +85.83% |

