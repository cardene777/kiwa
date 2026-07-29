# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0098ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0059ms | 0.0088ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.05ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 23328 B | -10814 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 600 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1232 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.0030ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0098ms | 0.01ms | -0.00080ms | -7.53% |
| p50 | 0.01ms | 0.01ms | -0.0040ms | -27.93% |
| p95 | 0.02ms | 0.02ms | -0.0030ms | -14.84% |
| p99 | 0.02ms | 0.03ms | -0.0071ms | -27.73% |
| mean | 0.01ms | 0.01ms | -0.0022ms | -15.27% |
| min | 0.0096ms | 0.01ms | -0.00083ms | -7.97% |
| max | 0.02ms | 0.03ms | -0.0082ms | -30.15% |
| total | 0.24ms | 0.29ms | -0.04ms | -15.27% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0062ms |
| p95 | 0.0088ms |
| p99 | 0.0095ms |
| mean | 0.0067ms |
| stdev | 0.0011ms |
| min | 0.0054ms |
| max | 0.0097ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0067ms | -0.00077ms | -11.65% |
| p50 | 0.0062ms | 0.0069ms | -0.00065ms | -9.43% |
| p95 | 0.0088ms | 0.0075ms | +0.0013ms | +17.09% |
| p99 | 0.0095ms | 0.0083ms | +0.0013ms | +15.20% |
| mean | 0.0067ms | 0.0070ms | -0.00027ms | -3.95% |
| min | 0.0054ms | 0.0065ms | -0.0011ms | -17.18% |
| max | 0.0097ms | 0.0085ms | +0.0012ms | +14.78% |
| total | 0.13ms | 0.14ms | -0.0055ms | -3.95% |

### subscribe_error_handling (5 fetch throw + catch + listener notify)

# Perf Report — subscribe_error_handling (5 fetch throw + catch + listener notify).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.03ms |
| max | 0.09ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00089ms | +3.44% |
| p50 | 0.03ms | 0.03ms | +0.0019ms | +7.36% |
| p95 | 0.04ms | 0.04ms | +0.0020ms | +4.86% |
| p99 | 0.08ms | 0.07ms | +0.0077ms | +11.17% |
| mean | 0.03ms | 0.03ms | +0.0016ms | +5.30% |
| min | 0.03ms | 0.02ms | +0.0011ms | +4.44% |
| max | 0.09ms | 0.08ms | +0.0092ms | +12.00% |
| total | 0.64ms | 0.61ms | +0.03ms | +5.30% |

