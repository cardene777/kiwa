# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0044ms | 0.0054ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0032ms | 0.0040ms | 100ms | 0.00043ms | PASS | stable — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | cpu | 0.08ms | 0.0044ms | 0.054 | 0.054 | 0.0045ms | 0.0045ms |
| form_submission_batch (5 invoke with FormData) | cpu | 0.08ms | 0.0032ms | 0.040 | 0.041 | 0.0032ms | 0.0033ms |
| action_error_handling (5 throw + catch) | cpu | 0.08ms | 0.02ms | 0.223 | 0.222 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.03ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.02ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.09ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | -377504 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 2872 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0045ms |
| p95 | 0.0054ms |
| p99 | 0.0063ms |
| mean | 0.0047ms |
| stdev | 0.00050ms |
| min | 0.0043ms |
| max | 0.0065ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0044ms | 0.0045ms | -0.000088ms | -1.98% |
| p50 | 0.0045ms | 0.0045ms | -0.000084ms | -1.85% |
| p95 | 0.0054ms | 0.0054ms | -0.000032ms | -0.59% |
| p99 | 0.0063ms | 0.0055ms | +0.00076ms | +13.77% |
| mean | 0.0047ms | 0.0047ms | -0.000042ms | -0.89% |
| min | 0.0043ms | 0.0045ms | -0.00013ms | -2.80% |
| max | 0.0065ms | 0.0055ms | +0.00096ms | +17.29% |
| total | 0.09ms | 0.09ms | -0.00083ms | -0.89% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0032ms |
| p50 | 0.0033ms |
| p95 | 0.0040ms |
| p99 | 0.0040ms |
| mean | 0.0034ms |
| stdev | 0.00031ms |
| min | 0.0032ms |
| max | 0.0040ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0032ms | 0.0033ms | -0.00017ms | -4.98% |
| p50 | 0.0033ms | 0.0034ms | -0.000083ms | -2.43% |
| p95 | 0.0040ms | 0.0044ms | -0.00045ms | -10.03% |
| p99 | 0.0040ms | 0.0049ms | -0.00089ms | -18.08% |
| mean | 0.0034ms | 0.0036ms | -0.00017ms | -4.83% |
| min | 0.0032ms | 0.0033ms | -0.00017ms | -5.01% |
| max | 0.0040ms | 0.0050ms | -0.0010ms | -19.85% |
| total | 0.07ms | 0.07ms | -0.0035ms | -4.83% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0012ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00020ms | +1.12% |
| p50 | 0.02ms | 0.02ms | +0.00044ms | +2.38% |
| p95 | 0.02ms | 0.02ms | +0.00043ms | +2.12% |
| p99 | 0.02ms | 0.02ms | +0.0019ms | +8.88% |
| mean | 0.02ms | 0.02ms | +0.00043ms | +2.28% |
| min | 0.02ms | 0.02ms | +0.00017ms | +0.91% |
| max | 0.02ms | 0.02ms | +0.0023ms | +10.47% |
| total | 0.38ms | 0.38ms | +0.0085ms | +2.28% |

