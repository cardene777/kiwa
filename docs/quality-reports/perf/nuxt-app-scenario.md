# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0086ms | 0.01ms | 100ms | 0.00040ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0029ms | 0.0040ms | 100ms | 0.00041ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | cpu | 0.09ms | 0.0086ms | 0.101 | 0.103 | 0.0082ms | 0.0083ms |
| middleware_chain (5 invokeRouteMiddleware) | cpu | 0.08ms | 0.0029ms | 0.036 | 0.035 | 0.0028ms | 0.0028ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.01ms | 0.181 | 0.178 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 6928 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 10096 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 1376 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0086ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0091ms |
| stdev | 0.00062ms |
| min | 0.0085ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0083ms | +0.00028ms | +3.35% |
| p50 | 0.0088ms | 0.0087ms | +0.00010ms | +1.19% |
| p95 | 0.01ms | 0.01ms | -0.0018ms | -15.07% |
| p99 | 0.01ms | 0.01ms | -0.0017ms | -13.67% |
| mean | 0.0091ms | 0.0092ms | -0.000098ms | -1.06% |
| min | 0.0085ms | 0.0083ms | +0.00021ms | +2.52% |
| max | 0.01ms | 0.01ms | -0.0017ms | -13.33% |
| total | 0.18ms | 0.18ms | -0.0020ms | -1.06% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0029ms |
| p95 | 0.0040ms |
| p99 | 0.0057ms |
| mean | 0.0032ms |
| stdev | 0.00075ms |
| min | 0.0028ms |
| max | 0.0062ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0028ms | +0.000079ms | +2.83% |
| p50 | 0.0029ms | 0.0030ms | -0.000063ms | -2.10% |
| p95 | 0.0040ms | 0.0085ms | -0.0045ms | -52.82% |
| p99 | 0.0057ms | 0.01ms | -0.0046ms | -44.49% |
| mean | 0.0032ms | 0.0037ms | -0.00058ms | -15.34% |
| min | 0.0028ms | 0.0027ms | +0.000083ms | +3.02% |
| max | 0.0062ms | 0.01ms | -0.0046ms | -42.86% |
| total | 0.06ms | 0.07ms | -0.01ms | -15.34% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0024ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000050ms | +0.34% |
| p50 | 0.02ms | 0.02ms | +0.00029ms | +1.94% |
| p95 | 0.02ms | 0.03ms | -0.01ms | -38.94% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -55.92% |
| mean | 0.02ms | 0.02ms | -0.0022ms | -12.36% |
| min | 0.01ms | 0.01ms | +0.00013ms | +0.87% |
| max | 0.03ms | 0.06ms | -0.04ms | -57.84% |
| total | 0.32ms | 0.36ms | -0.04ms | -12.36% |

