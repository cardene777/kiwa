# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.09ms | 0.14ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | cpu | 0.08ms | 0.09ms | 1.151 | 1.288 | 0.10ms | 0.11ms |
| endpoint_batch (5 invokeEndpoint JSON responses) | cpu | 0.08ms | 0.03ms | 0.348 | 0.317 | 0.03ms | 0.03ms |
| endpoint_error_handling (5 throw + catch) | cpu | 0.08ms | 0.03ms | 0.372 | 0.380 | 0.03ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.46ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.19ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 101216 B | 0 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -94064 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### page_render_workflow (10 renderAstroPage)

# Perf Report — page_render_workflow (10 renderAstroPage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.09ms |
| p50 | 0.11ms |
| p95 | 0.14ms |
| p99 | 0.15ms |
| mean | 0.11ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.15ms |
| total | 2.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.09ms | 0.11ms | -0.01ms | -13.17% |
| p50 | 0.11ms | 0.12ms | -0.01ms | -10.24% |
| p95 | 0.14ms | 0.38ms | -0.24ms | -63.58% |
| p99 | 0.15ms | 0.53ms | -0.38ms | -72.27% |
| mean | 0.11ms | 0.16ms | -0.04ms | -28.39% |
| min | 0.09ms | 0.10ms | -0.0060ms | -6.30% |
| max | 0.15ms | 0.56ms | -0.42ms | -73.72% |
| total | 2.24ms | 3.13ms | -0.89ms | -28.39% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0051ms |
| min | 0.03ms |
| max | 0.05ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.0023ms | +8.90% |
| p50 | 0.03ms | 0.03ms | +0.0014ms | +4.66% |
| p95 | 0.04ms | 0.19ms | -0.15ms | -79.86% |
| p99 | 0.05ms | 0.30ms | -0.26ms | -84.27% |
| mean | 0.03ms | 0.06ms | -0.02ms | -43.31% |
| min | 0.03ms | 0.03ms | +0.00029ms | +1.16% |
| max | 0.05ms | 0.33ms | -0.28ms | -84.91% |
| total | 0.65ms | 1.14ms | -0.49ms | -43.31% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0021ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00046ms | -1.46% |
| p50 | 0.03ms | 0.03ms | -0.00083ms | -2.55% |
| p95 | 0.03ms | 0.08ms | -0.04ms | -53.87% |
| p99 | 0.04ms | 0.11ms | -0.07ms | -64.30% |
| mean | 0.03ms | 0.04ms | -0.0072ms | -18.13% |
| min | 0.03ms | 0.03ms | -0.00017ms | -0.54% |
| max | 0.04ms | 0.12ms | -0.08ms | -65.97% |
| total | 0.65ms | 0.79ms | -0.14ms | -18.13% |

