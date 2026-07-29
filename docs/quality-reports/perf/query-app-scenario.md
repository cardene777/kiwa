# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0099ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0062ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.06ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | -2416 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 696 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0036ms |
| min | 0.0096ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.01ms | -0.00071ms | -6.68% |
| p50 | 0.01ms | 0.01ms | -0.0038ms | -26.19% |
| p95 | 0.02ms | 0.02ms | +0.00048ms | +2.37% |
| p99 | 0.02ms | 0.03ms | -0.0048ms | -18.79% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -11.24% |
| min | 0.0096ms | 0.01ms | -0.00083ms | -7.97% |
| max | 0.02ms | 0.03ms | -0.0062ms | -22.77% |
| total | 0.25ms | 0.29ms | -0.03ms | -11.24% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0062ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0082ms |
| stdev | 0.0015ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0067ms | -0.00044ms | -6.56% |
| p50 | 0.0079ms | 0.0069ms | +0.0010ms | +14.59% |
| p95 | 0.01ms | 0.0075ms | +0.0032ms | +42.84% |
| p99 | 0.01ms | 0.0083ms | +0.0030ms | +36.01% |
| mean | 0.0082ms | 0.0070ms | +0.0012ms | +17.74% |
| min | 0.0057ms | 0.0065ms | -0.00079ms | -12.09% |
| max | 0.01ms | 0.0085ms | +0.0029ms | +34.49% |
| total | 0.16ms | 0.14ms | +0.02ms | +17.74% |

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
| stdev | 0.0030ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0029ms | -11.13% |
| p50 | 0.02ms | 0.03ms | -0.0023ms | -8.63% |
| p95 | 0.03ms | 0.04ms | -0.0099ms | -24.37% |
| p99 | 0.03ms | 0.07ms | -0.04ms | -52.23% |
| mean | 0.03ms | 0.03ms | -0.0051ms | -16.83% |
| min | 0.02ms | 0.02ms | -0.0020ms | -8.36% |
| max | 0.03ms | 0.08ms | -0.04ms | -55.92% |
| total | 0.51ms | 0.61ms | -0.10ms | -16.83% |

