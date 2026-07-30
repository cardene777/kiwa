# Perf Suite — astro-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.10ms | 0.14ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.03ms | 0.03ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |
| endpoint_error_handling (5 throw + catch) | 0.03ms | 0.04ms | 100ms | 0.00054ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | cpu | 0.08ms | 0.09ms | 0.10ms | 1.230 | 1.217 | 0.10ms | 0.10ms |
| endpoint_batch (5 invokeEndpoint JSON responses) | cpu | 0.08ms | 0.09ms | 0.03ms | 0.306 | 0.304 | 0.03ms | 0.03ms |
| endpoint_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.03ms | 0.402 | 0.379 | 0.04ms | 0.03ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 0.55ms | 200ms | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | 0.15ms | 200ms | PASS |
| endpoint_error_handling (5 throw + catch) | 0.14ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| page_render_workflow (10 renderAstroPage) | 98056 B | -30 B | 102400 B | yes | PASS |
| endpoint_batch (5 invokeEndpoint JSON responses) | -93312 B | 0 B | 102400 B | yes | PASS |
| endpoint_error_handling (5 throw + catch) | -1448 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.15ms |
| mean | 0.12ms |
| stdev | 0.02ms |
| min | 0.09ms |
| max | 0.15ms |
| total | 2.40ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.000)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.10ms | 0.10ms | +0.0010ms | +1.02% |
| p50 | 0.12ms | 0.12ms | +0.0051ms | +4.36% |
| p95 | 0.14ms | 0.14ms | +0.00031ms | +0.23% |
| p99 | 0.15ms | 0.19ms | -0.04ms | -20.90% |
| mean | 0.12ms | 0.12ms | +0.00042ms | +0.35% |
| min | 0.09ms | 0.10ms | -0.0037ms | -3.81% |
| max | 0.15ms | 0.20ms | -0.05ms | -24.52% |
| total | 2.41ms | 2.40ms | +0.0084ms | +0.35% |

### endpoint_batch (5 invokeEndpoint JSON responses)

# Perf Report — endpoint_batch (5 invokeEndpoint JSON responses).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.03ms |
| stdev | 0.0018ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.54ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.044)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00022ms | +0.84% |
| p50 | 0.03ms | 0.03ms | +0.000033ms | +0.12% |
| p95 | 0.03ms | 0.03ms | -0.000094ms | -0.30% |
| p99 | 0.03ms | 0.03ms | +0.00075ms | +2.31% |
| mean | 0.03ms | 0.03ms | +0.00032ms | +1.14% |
| min | 0.03ms | 0.03ms | -0.00028ms | -1.08% |
| max | 0.03ms | 0.03ms | +0.00096ms | +2.93% |
| total | 0.56ms | 0.56ms | +0.0063ms | +1.14% |

### endpoint_error_handling (5 throw + catch)

# Perf Report — endpoint_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0019ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.69ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.096)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.03ms | +0.0020ms | +6.09% |
| p50 | 0.04ms | 0.04ms | +0.0027ms | +7.73% |
| p95 | 0.04ms | 0.04ms | -0.0023ms | -5.35% |
| p99 | 0.04ms | 0.05ms | -0.0038ms | -8.02% |
| mean | 0.04ms | 0.04ms | +0.0016ms | +4.45% |
| min | 0.03ms | 0.03ms | +0.0015ms | +4.55% |
| max | 0.04ms | 0.05ms | -0.0042ms | -8.60% |
| total | 0.76ms | 0.73ms | +0.03ms | +4.45% |

