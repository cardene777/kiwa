# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.10ms | 0.14ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.04ms | 0.09ms | 100ms | 0.00050ms | PASS | stable (p10 -3% (閾値未満)、 p95 +74% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.57ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.19ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | -392248 B | -30 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 184 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1560 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.14ms |
| p99 | 0.14ms |
| mean | 0.12ms |
| stdev | 0.01ms |
| min | 0.09ms |
| max | 0.14ms |
| total | 2.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0044ms | -4.17% |
| p50 | 0.12ms | 0.12ms | +0.00077ms | +0.66% |
| p95 | 0.14ms | 0.17ms | -0.03ms | -19.74% |
| p99 | 0.14ms | 0.18ms | -0.04ms | -20.56% |
| mean | 0.12ms | 0.13ms | -0.0091ms | -7.19% |
| min | 0.09ms | 0.10ms | -0.0032ms | -3.35% |
| max | 0.14ms | 0.18ms | -0.04ms | -20.75% |
| total | 2.34ms | 2.52ms | -0.18ms | -7.19% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.09ms |
| p99 | 0.15ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.17ms |
| total | 0.98ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.0010ms | -2.62% |
| p50 | 0.04ms | 0.04ms | -0.00085ms | -2.13% |
| p95 | 0.09ms | 0.05ms | +0.04ms | +74.41% |
| p99 | 0.15ms | 0.06ms | +0.10ms | +174.51% |
| mean | 0.05ms | 0.04ms | +0.0075ms | +17.87% |
| min | 0.04ms | 0.04ms | -0.00062ms | -1.61% |
| max | 0.17ms | 0.06ms | +0.11ms | +196.56% |
| total | 0.98ms | 0.83ms | +0.15ms | +17.87% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0040ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.68ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00055ms | +1.76% |
| p50 | 0.03ms | 0.03ms | +0.00044ms | +1.36% |
| p95 | 0.04ms | 0.05ms | -0.0063ms | -13.03% |
| p99 | 0.05ms | 0.09ms | -0.05ms | -51.39% |
| mean | 0.03ms | 0.04ms | -0.0037ms | -9.76% |
| min | 0.03ms | 0.03ms | +0.00058ms | +1.88% |
| max | 0.05ms | 0.11ms | -0.06ms | -55.76% |
| total | 0.68ms | 0.76ms | -0.07ms | -9.76% |

