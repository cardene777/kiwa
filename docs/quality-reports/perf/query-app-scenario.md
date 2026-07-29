# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0097ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0052ms | 0.0078ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 7712 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 600 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 832 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0043ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.01ms | -0.00096ms | -9.02% |
| p50 | 0.01ms | 0.01ms | -0.0039ms | -27.06% |
| p95 | 0.02ms | 0.02ms | +0.0013ms | +6.16% |
| p99 | 0.02ms | 0.03ms | -0.0018ms | -7.19% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -11.37% |
| min | 0.0096ms | 0.01ms | -0.00088ms | -8.37% |
| max | 0.02ms | 0.03ms | -0.0026ms | -9.69% |
| total | 0.25ms | 0.29ms | -0.03ms | -11.37% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0053ms |
| p95 | 0.0078ms |
| p99 | 0.0095ms |
| mean | 0.0058ms |
| stdev | 0.0012ms |
| min | 0.0052ms |
| max | 0.0099ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0067ms | -0.0014ms | -21.73% |
| p50 | 0.0053ms | 0.0069ms | -0.0016ms | -23.10% |
| p95 | 0.0078ms | 0.0075ms | +0.00023ms | +3.04% |
| p99 | 0.0095ms | 0.0083ms | +0.0012ms | +14.25% |
| mean | 0.0058ms | 0.0070ms | -0.0011ms | -16.15% |
| min | 0.0052ms | 0.0065ms | -0.0014ms | -21.01% |
| max | 0.0099ms | 0.0085ms | +0.0014ms | +16.75% |
| total | 0.12ms | 0.14ms | -0.02ms | -16.15% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0038ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0023ms | -8.88% |
| p50 | 0.02ms | 0.03ms | -0.0023ms | -8.71% |
| p95 | 0.03ms | 0.04ms | -0.0082ms | -20.39% |
| p99 | 0.04ms | 0.07ms | -0.03ms | -46.56% |
| mean | 0.03ms | 0.03ms | -0.0049ms | -16.16% |
| min | 0.02ms | 0.02ms | -0.0021ms | -8.70% |
| max | 0.04ms | 0.08ms | -0.04ms | -50.03% |
| total | 0.51ms | 0.61ms | -0.10ms | -16.16% |

