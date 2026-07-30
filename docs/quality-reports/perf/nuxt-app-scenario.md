# Perf Suite — nuxt-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.0086ms | 0.01ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| middleware_chain (5 invokeRouteMiddleware) | 0.0029ms | 0.0036ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| handler_error_handling (5 throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | cpu | 0.08ms | 0.08ms | 0.0086ms | 0.103 | 0.101 | 0.0084ms | 0.0082ms |
| middleware_chain (5 invokeRouteMiddleware) | cpu | 0.08ms | 0.09ms | 0.0029ms | 0.035 | 0.036 | 0.0028ms | 0.0029ms |
| handler_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.01ms | 0.175 | 0.181 | 0.01ms | 0.01ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 0.05ms | 200ms | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 0.02ms | 200ms | PASS |
| handler_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| event_handler_workflow (10 invokeEventHandler) | 5216 B | 0 B | 102400 B | yes | PASS |
| middleware_chain (5 invokeRouteMiddleware) | 4016 B | 0 B | 102400 B | yes | PASS |
| handler_error_handling (5 throw + catch) | 816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### event_handler_workflow (10 invokeEventHandler)

# Perf Report — event_handler_workflow (10 invokeEventHandler).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0086ms |
| p50 | 0.0087ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0091ms |
| stdev | 0.00089ms |
| min | 0.0084ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.981)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0084ms | 0.0082ms | +0.00017ms | +2.06% |
| p50 | 0.0085ms | 0.0085ms | +0.000018ms | +0.21% |
| p95 | 0.0098ms | 0.0099ms | -0.000017ms | -0.17% |
| p99 | 0.01ms | 0.01ms | +0.0014ms | +13.66% |
| mean | 0.0089ms | 0.0087ms | +0.00016ms | +1.82% |
| min | 0.0083ms | 0.0082ms | +0.000087ms | +1.06% |
| max | 0.01ms | 0.01ms | +0.0018ms | +16.95% |
| total | 0.18ms | 0.17ms | +0.0032ms | +1.82% |

### middleware_chain (5 invokeRouteMiddleware)

# Perf Report — middleware_chain (5 invokeRouteMiddleware).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0029ms |
| p95 | 0.0036ms |
| p99 | 0.0057ms |
| mean | 0.0032ms |
| stdev | 0.00076ms |
| min | 0.0028ms |
| max | 0.0063ms |
| total | 0.06ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.976)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0029ms | -0.000070ms | -2.44% |
| p50 | 0.0029ms | 0.0029ms | -0.000072ms | -2.44% |
| p95 | 0.0035ms | 0.01ms | -0.0066ms | -65.61% |
| p99 | 0.0056ms | 0.01ms | -0.0079ms | -58.64% |
| mean | 0.0031ms | 0.0040ms | -0.00090ms | -22.62% |
| min | 0.0028ms | 0.0029ms | -0.00011ms | -3.87% |
| max | 0.0061ms | 0.01ms | -0.0083ms | -57.42% |
| total | 0.06ms | 0.08ms | -0.02ms | -22.62% |

### handler_error_handling (5 throw + catch)

# Perf Report — handler_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0028ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.32ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00046ms | -3.16% |
| p50 | 0.01ms | 0.02ms | -0.00056ms | -3.70% |
| p95 | 0.02ms | 0.02ms | +0.00038ms | +2.13% |
| p99 | 0.02ms | 0.03ms | -0.0012ms | -4.63% |
| mean | 0.02ms | 0.02ms | -0.00024ms | -1.53% |
| min | 0.01ms | 0.01ms | -0.00031ms | -2.14% |
| max | 0.03ms | 0.03ms | -0.0016ms | -5.73% |
| total | 0.31ms | 0.32ms | -0.0049ms | -1.53% |

