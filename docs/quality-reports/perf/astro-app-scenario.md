# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.10ms | 0.15ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.04ms | 0.12ms | 100ms | 0.00050ms | PASS | stable (p10 -1% (閾値未満)、 p95 +130% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.42ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.20ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 94544 B | -30 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -184 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.15ms |
| p99 | 0.18ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.18ms |
| total | 2.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.11ms | -0.0094ms | -8.94% |
| p50 | 0.12ms | 0.12ms | -0.0022ms | -1.86% |
| p95 | 0.15ms | 0.17ms | -0.02ms | -11.73% |
| p99 | 0.18ms | 0.18ms | -0.0017ms | -0.94% |
| mean | 0.12ms | 0.13ms | -0.0077ms | -6.08% |
| min | 0.09ms | 0.10ms | -0.0062ms | -6.48% |
| max | 0.18ms | 0.18ms | +0.0029ms | +1.60% |
| total | 2.37ms | 2.52ms | -0.15ms | -6.08% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.04ms |
| p95 | 0.12ms |
| p99 | 0.16ms |
| mean | 0.05ms |
| stdev | 0.03ms |
| min | 0.04ms |
| max | 0.17ms |
| total | 1.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.04ms | -0.00042ms | -1.06% |
| p50 | 0.04ms | 0.04ms | +0.0013ms | +3.21% |
| p95 | 0.12ms | 0.05ms | +0.07ms | +130.21% |
| p99 | 0.16ms | 0.06ms | +0.11ms | +193.53% |
| mean | 0.05ms | 0.04ms | +0.01ms | +29.57% |
| min | 0.04ms | 0.04ms | -0.00025ms | -0.64% |
| max | 0.17ms | 0.06ms | +0.12ms | +207.48% |
| total | 1.08ms | 0.83ms | +0.25ms | +29.57% |

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
| mean | 0.04ms |
| stdev | 0.0054ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.73ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.000055ms | -0.18% |
| p50 | 0.03ms | 0.03ms | +0.0019ms | +6.03% |
| p95 | 0.04ms | 0.05ms | -0.0039ms | -8.01% |
| p99 | 0.05ms | 0.09ms | -0.05ms | -48.82% |
| mean | 0.04ms | 0.04ms | -0.0016ms | -4.17% |
| min | 0.03ms | 0.03ms | -0.00096ms | -3.09% |
| max | 0.05ms | 0.11ms | -0.06ms | -53.47% |
| total | 0.73ms | 0.76ms | -0.03ms | -4.17% |

