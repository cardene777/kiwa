# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0098ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0052ms | 0.0074ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.04ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 6352 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 408 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0098ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.01ms | -0.00083ms | -7.84% |
| p50 | 0.01ms | 0.01ms | -0.0018ms | -12.59% |
| p95 | 0.02ms | 0.02ms | -0.0023ms | -11.33% |
| p99 | 0.02ms | 0.03ms | -0.0032ms | -12.28% |
| mean | 0.01ms | 0.01ms | -0.0014ms | -9.92% |
| min | 0.0096ms | 0.01ms | -0.00083ms | -7.97% |
| max | 0.02ms | 0.03ms | -0.0034ms | -12.46% |
| total | 0.26ms | 0.29ms | -0.03ms | -9.92% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.0074ms |
| p99 | 0.0083ms |
| mean | 0.0058ms |
| stdev | 0.00094ms |
| min | 0.0051ms |
| max | 0.0086ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0067ms | -0.0014ms | -21.79% |
| p50 | 0.0053ms | 0.0069ms | -0.0015ms | -22.49% |
| p95 | 0.0074ms | 0.0075ms | -0.00015ms | -2.02% |
| p99 | 0.0083ms | 0.0083ms | +0.000070ms | +0.85% |
| mean | 0.0058ms | 0.0070ms | -0.0012ms | -16.74% |
| min | 0.0051ms | 0.0065ms | -0.0015ms | -22.29% |
| max | 0.0086ms | 0.0085ms | +0.00013ms | +1.49% |
| total | 0.12ms | 0.14ms | -0.02ms | -16.74% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0026ms | -9.98% |
| p50 | 0.02ms | 0.03ms | -0.0025ms | -9.34% |
| p95 | 0.03ms | 0.04ms | -0.0085ms | -20.98% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -51.26% |
| mean | 0.03ms | 0.03ms | -0.0052ms | -17.22% |
| min | 0.02ms | 0.02ms | -0.0020ms | -8.19% |
| max | 0.03ms | 0.08ms | -0.04ms | -55.27% |
| total | 0.50ms | 0.61ms | -0.10ms | -17.22% |

