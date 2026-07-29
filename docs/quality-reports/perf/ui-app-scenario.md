# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.75ms | 8.52ms | 200ms | 0.00050ms | PASS | stable (p10 +15% (閾値未満)、 p95 +578% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.49ms | 0.59ms | 200ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.83ms | 8.07ms | 200ms | 0.00050ms | PASS | stable (p10 -13% (閾値未満)、 p95 +99% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 9.45ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 2.58ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 10.45ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -159512 B | -935 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | -2032 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4476416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.79ms |
| p95 | 8.52ms |
| p99 | 17.10ms |
| mean | 2.31ms |
| stdev | 4.33ms |
| min | 0.74ms |
| max | 19.24ms |
| total | 46.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.65ms | +0.10ms | +14.95% |
| p50 | 0.79ms | 0.81ms | -0.02ms | -2.12% |
| p95 | 8.52ms | 1.26ms | +7.26ms | +577.56% |
| p99 | 17.10ms | 3.61ms | +13.49ms | +374.09% |
| mean | 2.31ms | 1.00ms | +1.31ms | +131.74% |
| min | 0.74ms | 0.60ms | +0.14ms | +23.47% |
| max | 19.24ms | 4.19ms | +15.05ms | +358.84% |
| total | 46.21ms | 19.94ms | +26.27ms | +131.74% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.49ms |
| p50 | 0.52ms |
| p95 | 0.59ms |
| p99 | 0.63ms |
| mean | 0.53ms |
| stdev | 0.04ms |
| min | 0.47ms |
| max | 0.64ms |
| total | 10.63ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.49ms | 0.38ms | +0.10ms | +27.02% |
| p50 | 0.52ms | 0.45ms | +0.07ms | +15.34% |
| p95 | 0.59ms | 1.01ms | -0.43ms | -42.30% |
| p99 | 0.63ms | 1.31ms | -0.69ms | -52.42% |
| mean | 0.53ms | 0.52ms | +0.01ms | +2.34% |
| min | 0.47ms | 0.38ms | +0.09ms | +23.43% |
| max | 0.64ms | 1.39ms | -0.75ms | -54.27% |
| total | 10.63ms | 10.39ms | +0.24ms | +2.34% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.83ms |
| p50 | 1.08ms |
| p95 | 8.07ms |
| p99 | 17.33ms |
| mean | 2.28ms |
| stdev | 4.34ms |
| min | 0.81ms |
| max | 19.65ms |
| total | 45.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.83ms | 0.96ms | -0.13ms | -13.33% |
| p50 | 1.08ms | 1.05ms | +0.03ms | +2.47% |
| p95 | 8.07ms | 4.05ms | +4.02ms | +99.17% |
| p99 | 17.33ms | 7.82ms | +9.52ms | +121.72% |
| mean | 2.28ms | 1.77ms | +0.51ms | +28.96% |
| min | 0.81ms | 0.92ms | -0.11ms | -11.75% |
| max | 19.65ms | 8.76ms | +10.89ms | +124.33% |
| total | 45.55ms | 35.32ms | +10.23ms | +28.96% |

