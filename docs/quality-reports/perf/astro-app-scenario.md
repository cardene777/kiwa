# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.10ms | 0.15ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.05ms | 100ms | 0.00092ms | PASS | improved — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.65ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.14ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.26ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 101256 B | 0 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -103488 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.10ms |
| p50 | 0.12ms |
| p95 | 0.15ms |
| p99 | 0.16ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.16ms |
| total | 2.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0038ms | -3.57% |
| p50 | 0.12ms | 0.12ms | -0.0011ms | -0.96% |
| p95 | 0.15ms | 0.17ms | -0.02ms | -11.87% |
| p99 | 0.16ms | 0.18ms | -0.02ms | -9.44% |
| mean | 0.12ms | 0.13ms | -0.0062ms | -4.94% |
| min | 0.09ms | 0.10ms | -0.0018ms | -1.87% |
| max | 0.16ms | 0.18ms | -0.02ms | -8.87% |
| total | 2.40ms | 2.52ms | -0.12ms | -4.94% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.04ms | -0.01ms | -34.81% |
| p50 | 0.03ms | 0.04ms | -0.01ms | -33.07% |
| p95 | 0.05ms | 0.05ms | -0.0036ms | -7.10% |
| p99 | 0.07ms | 0.06ms | +0.02ms | +29.84% |
| mean | 0.03ms | 0.04ms | -0.01ms | -26.35% |
| min | 0.02ms | 0.04ms | -0.01ms | -35.84% |
| max | 0.08ms | 0.06ms | +0.02ms | +37.98% |
| total | 0.61ms | 0.83ms | -0.22ms | -26.35% |

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
| stdev | 0.0052ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00075ms | -2.41% |
| p50 | 0.03ms | 0.03ms | +0.0014ms | +4.41% |
| p95 | 0.04ms | 0.05ms | -0.0039ms | -8.17% |
| p99 | 0.05ms | 0.09ms | -0.05ms | -48.80% |
| mean | 0.03ms | 0.04ms | -0.0029ms | -7.55% |
| min | 0.03ms | 0.03ms | -0.00075ms | -2.42% |
| max | 0.05ms | 0.11ms | -0.06ms | -53.43% |
| total | 0.70ms | 0.76ms | -0.06ms | -7.55% |

