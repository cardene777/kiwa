# Perf Suite — query-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.0095ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.0061ms | 0.0091ms | 100ms | 0.00050ms | PASS | stable (p10 -8% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | 0.07ms | 200ms | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 0.03ms | 200ms | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| dashboard_fetch_workflow (10 fetchQuery across 4 providers) | -2824 B | 0 B | 102400 B | yes | PASS |
| mutation_invalidate_batch (5 mutate with invalidate chain) | 168 B | 0 B | 102400 B | yes | PASS |
| subscribe_error_handling (5 fetch throw + catch + listener notify) | 1152 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### dashboard_fetch_workflow (10 fetchQuery across 4 providers)

# Perf Report — dashboard_fetch_workflow (10 fetchQuery across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.01ms | -0.0011ms | -10.20% |
| p50 | 0.01ms | 0.01ms | -0.0025ms | -17.65% |
| p95 | 0.02ms | 0.02ms | -0.0028ms | -13.70% |
| p99 | 0.02ms | 0.03ms | -0.0047ms | -18.10% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -11.35% |
| min | 0.0094ms | 0.01ms | -0.0010ms | -9.95% |
| max | 0.02ms | 0.03ms | -0.0051ms | -18.92% |
| total | 0.25ms | 0.29ms | -0.03ms | -11.35% |

### mutation_invalidate_batch (5 mutate with invalidate chain)

# Perf Report — mutation_invalidate_batch (5 mutate with invalidate chain).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0066ms |
| p95 | 0.0091ms |
| p99 | 0.01ms |
| mean | 0.0071ms |
| stdev | 0.0012ms |
| min | 0.0060ms |
| max | 0.01ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0067ms | -0.00053ms | -7.94% |
| p50 | 0.0066ms | 0.0069ms | -0.00029ms | -4.26% |
| p95 | 0.0091ms | 0.0075ms | +0.0016ms | +20.54% |
| p99 | 0.01ms | 0.0083ms | +0.0023ms | +27.91% |
| mean | 0.0071ms | 0.0070ms | +0.000092ms | +1.32% |
| min | 0.0060ms | 0.0065ms | -0.00050ms | -7.63% |
| max | 0.01ms | 0.0085ms | +0.0025ms | +29.56% |
| total | 0.14ms | 0.14ms | +0.0018ms | +1.32% |

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
| stdev | 0.0032ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0028ms | -10.77% |
| p50 | 0.02ms | 0.03ms | -0.0023ms | -8.63% |
| p95 | 0.03ms | 0.04ms | -0.0096ms | -23.67% |
| p99 | 0.04ms | 0.07ms | -0.03ms | -49.26% |
| mean | 0.03ms | 0.03ms | -0.0051ms | -16.76% |
| min | 0.02ms | 0.02ms | -0.0016ms | -6.48% |
| max | 0.04ms | 0.08ms | -0.04ms | -52.65% |
| total | 0.51ms | 0.61ms | -0.10ms | -16.76% |

