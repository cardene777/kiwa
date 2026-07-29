# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0097ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0050ms | 0.0086ms | 100ms | 0.00042ms | PASS | improved — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 8200 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 8 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.0097ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.00092ms | -8.63% |
| p50 | 0.01ms | 0.01ms | -0.0039ms | -27.21% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -11.08% |
| p99 | 0.02ms | 0.03ms | -0.0055ms | -21.31% |
| mean | 0.01ms | 0.01ms | -0.0020ms | -14.22% |
| min | 0.0097ms | 0.01ms | -0.00079ms | -7.57% |
| max | 0.02ms | 0.03ms | -0.0063ms | -23.23% |
| total | 0.25ms | 0.29ms | -0.04ms | -14.22% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0052ms |
| p95 | 0.0086ms |
| p99 | 0.0089ms |
| mean | 0.0059ms |
| stdev | 0.0012ms |
| min | 0.0050ms |
| max | 0.0089ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0067ms | -0.0016ms | -24.30% |
| p50 | 0.0052ms | 0.0069ms | -0.0016ms | -23.70% |
| p95 | 0.0086ms | 0.0075ms | +0.0011ms | +14.46% |
| p99 | 0.0089ms | 0.0083ms | +0.00058ms | +7.07% |
| mean | 0.0059ms | 0.0070ms | -0.0011ms | -15.91% |
| min | 0.0050ms | 0.0065ms | -0.0016ms | -24.20% |
| max | 0.0089ms | 0.0085ms | +0.00046ms | +5.41% |
| total | 0.12ms | 0.14ms | -0.02ms | -15.91% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.58ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0022ms | -8.68% |
| p50 | 0.02ms | 0.03ms | -0.0018ms | -6.73% |
| p95 | 0.04ms | 0.04ms | -0.00093ms | -2.31% |
| p99 | 0.07ms | 0.07ms | +0.0032ms | +4.69% |
| mean | 0.03ms | 0.03ms | -0.0016ms | -5.19% |
| min | 0.02ms | 0.02ms | -0.0017ms | -7.00% |
| max | 0.08ms | 0.08ms | +0.0043ms | +5.62% |
| total | 0.58ms | 0.61ms | -0.03ms | -5.19% |

