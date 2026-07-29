# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.12ms | 3.42ms | 100ms | 0.00050ms | PASS | stable (p10 +15% (閾値未満)、 p95 +1928% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.05ms | 0.08ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.04ms | 0.39ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 2.08ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.35ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.32ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 90456 B | -1405 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -4632 B | -3060 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | 5248 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.12ms |
| p50 | 0.14ms |
| p95 | 3.42ms |
| p99 | 8.68ms |
| mean | 0.90ms |
| stdev | 2.25ms |
| min | 0.11ms |
| max | 9.99ms |
| total | 18.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.12ms | 0.11ms | +0.02ms | +15.48% |
| p50 | 0.14ms | 0.12ms | +0.03ms | +22.29% |
| p95 | 3.42ms | 0.17ms | +3.25ms | +1927.94% |
| p99 | 8.68ms | 0.18ms | +8.50ms | +4785.47% |
| mean | 0.90ms | 0.13ms | +0.78ms | +615.85% |
| min | 0.11ms | 0.10ms | +0.02ms | +18.96% |
| max | 9.99ms | 0.18ms | +9.81ms | +5455.99% |
| total | 18.07ms | 2.52ms | +15.55ms | +615.85% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.15ms |
| mean | 0.06ms |
| stdev | 0.03ms |
| min | 0.05ms |
| max | 0.17ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.04ms | +0.0097ms | +24.60% |
| p50 | 0.05ms | 0.04ms | +0.01ms | +27.47% |
| p95 | 0.08ms | 0.05ms | +0.03ms | +68.06% |
| p99 | 0.15ms | 0.06ms | +0.10ms | +171.86% |
| mean | 0.06ms | 0.04ms | +0.02ms | +42.01% |
| min | 0.05ms | 0.04ms | +0.0095ms | +24.47% |
| max | 0.17ms | 0.06ms | +0.11ms | +194.72% |
| total | 1.18ms | 0.83ms | +0.35ms | +42.01% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.39ms |
| p99 | 0.54ms |
| mean | 0.11ms |
| stdev | 0.15ms |
| min | 0.04ms |
| max | 0.57ms |
| total | 2.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0065ms | +20.84% |
| p50 | 0.04ms | 0.03ms | +0.01ms | +32.68% |
| p95 | 0.39ms | 0.05ms | +0.35ms | +719.00% |
| p99 | 0.54ms | 0.09ms | +0.44ms | +468.46% |
| mean | 0.11ms | 0.04ms | +0.08ms | +198.82% |
| min | 0.04ms | 0.03ms | +0.0054ms | +17.45% |
| max | 0.57ms | 0.11ms | +0.46ms | +439.94% |
| total | 2.26ms | 0.76ms | +1.50ms | +198.82% |

