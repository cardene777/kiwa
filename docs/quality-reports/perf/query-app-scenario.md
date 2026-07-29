# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0096ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0062ms | 0.0095ms | 100ms | 0.00049ms | PASS | stable (p10 -6% (閾値未満)、 p95 +26% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.04ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 9928 B | -10838 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 600 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0096ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0031ms |
| min | 0.0095ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0096ms | 0.01ms | -0.0010ms | -9.42% |
| p50 | 0.01ms | 0.01ms | -0.0038ms | -26.62% |
| p95 | 0.02ms | 0.02ms | -0.0012ms | -5.86% |
| p99 | 0.02ms | 0.03ms | -0.0060ms | -23.46% |
| mean | 0.01ms | 0.01ms | -0.0023ms | -15.83% |
| min | 0.0095ms | 0.01ms | -0.0010ms | -9.55% |
| max | 0.02ms | 0.03ms | -0.0072ms | -26.77% |
| total | 0.24ms | 0.29ms | -0.05ms | -15.83% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0069ms |
| p95 | 0.0095ms |
| p99 | 0.01ms |
| mean | 0.0074ms |
| stdev | 0.0014ms |
| min | 0.0062ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0067ms | -0.00041ms | -6.13% |
| p50 | 0.0069ms | 0.0069ms | +8.7e-19ms | +0.00% |
| p95 | 0.0095ms | 0.0075ms | +0.0019ms | +25.53% |
| p99 | 0.01ms | 0.0083ms | +0.0027ms | +32.85% |
| mean | 0.0074ms | 0.0070ms | +0.00043ms | +6.16% |
| min | 0.0062ms | 0.0065ms | -0.00033ms | -5.09% |
| max | 0.01ms | 0.0085ms | +0.0029ms | +34.49% |
| total | 0.15ms | 0.14ms | +0.0086ms | +6.16% |

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
| mean | 0.02ms |
| stdev | 0.0033ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0033ms | -12.77% |
| p50 | 0.02ms | 0.03ms | -0.0034ms | -12.98% |
| p95 | 0.03ms | 0.04ms | -0.01ms | -24.92% |
| p99 | 0.03ms | 0.07ms | -0.03ms | -50.08% |
| mean | 0.02ms | 0.03ms | -0.0062ms | -20.42% |
| min | 0.02ms | 0.02ms | -0.0026ms | -10.75% |
| max | 0.04ms | 0.08ms | -0.04ms | -53.41% |
| total | 0.48ms | 0.61ms | -0.12ms | -20.42% |

