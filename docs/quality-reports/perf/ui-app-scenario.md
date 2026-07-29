# Perf Suite — ui-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限はこの 2 倍 = 0.00050ms。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | gate | regression |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | 0.75ms | 4.27ms | 200ms | PASS | stable (下側は動かず p95 のみ +240% (実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| snapshot_batch (3 snapshot mode consecutive) | 0.36ms | 0.66ms | 200ms | PASS | stable — gate 無効 (regressionGate=false) |
| mount_error_handling (3 throw + catch during render) | 0.79ms | 28.64ms | 200ms | PASS | stable (下側は動かず p95 のみ +607% (実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| component_workflow (3 different components mount+stop) | 5.90ms | 400ms | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 4.20ms | 400ms | PASS |
| mount_error_handling (3 throw + catch during render) | 6.45ms | 400ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| component_workflow (3 different components mount+stop) | -148064 B | 0 B | 102400 B | yes | PASS |
| snapshot_batch (3 snapshot mode consecutive) | 16176 B | 0 B | 102400 B | yes | PASS |
| mount_error_handling (3 throw + catch during render) | 4425344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### component_workflow (3 different components mount+stop)

# Perf Report — component_workflow (3 different components mount+stop).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.75ms |
| p50 | 0.89ms |
| p95 | 4.27ms |
| p99 | 4.77ms |
| mean | 1.35ms |
| stdev | 1.15ms |
| min | 0.72ms |
| max | 4.90ms |
| total | 26.99ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.75ms | 0.65ms | +0.09ms | +14.53% |
| p50 | 0.89ms | 0.81ms | +0.08ms | +10.42% |
| p95 | 4.27ms | 1.26ms | +3.01ms | +239.68% |
| p99 | 4.77ms | 3.61ms | +1.17ms | +32.39% |
| mean | 1.35ms | 1.00ms | +0.35ms | +35.37% |
| min | 0.72ms | 0.60ms | +0.11ms | +19.03% |
| max | 4.90ms | 4.19ms | +0.71ms | +16.85% |
| total | 26.99ms | 19.94ms | +7.05ms | +35.37% |

### snapshot_batch (3 snapshot mode consecutive)

# Perf Report — snapshot_batch (3 snapshot mode consecutive).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.36ms |
| p50 | 0.46ms |
| p95 | 0.66ms |
| p99 | 2.03ms |
| mean | 0.54ms |
| stdev | 0.43ms |
| min | 0.35ms |
| max | 2.37ms |
| total | 10.83ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.36ms | 0.38ms | -0.03ms | -6.51% |
| p50 | 0.46ms | 0.45ms | +0.0093ms | +2.04% |
| p95 | 0.66ms | 1.01ms | -0.36ms | -35.08% |
| p99 | 2.03ms | 1.31ms | +0.71ms | +54.08% |
| mean | 0.54ms | 0.52ms | +0.02ms | +4.26% |
| min | 0.35ms | 0.38ms | -0.03ms | -7.84% |
| max | 2.37ms | 1.39ms | +0.98ms | +70.37% |
| total | 10.83ms | 10.39ms | +0.44ms | +4.26% |

### mount_error_handling (3 throw + catch during render)

# Perf Report — mount_error_handling (3 throw + catch during render).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.79ms |
| p50 | 1.85ms |
| p95 | 28.64ms |
| p99 | 43.52ms |
| mean | 6.62ms |
| stdev | 11.54ms |
| min | 0.77ms |
| max | 47.24ms |
| total | 132.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.79ms | 0.96ms | -0.17ms | -17.75% |
| p50 | 1.85ms | 1.05ms | +0.79ms | +74.92% |
| p95 | 28.64ms | 4.05ms | +24.59ms | +607.32% |
| p99 | 43.52ms | 7.82ms | +35.70ms | +456.66% |
| mean | 6.62ms | 1.77ms | +4.85ms | +274.73% |
| min | 0.77ms | 0.92ms | -0.16ms | -17.11% |
| max | 47.24ms | 8.76ms | +38.48ms | +439.25% |
| total | 132.36ms | 35.32ms | +97.04ms | +274.73% |

