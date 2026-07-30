# Perf Suite — nextjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.0047ms | 0.0077ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| form_submission_batch (5 invoke with FormData) | 0.0044ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| action_error_handling (5 throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | cpu | 0.08ms | 0.10ms | 0.0047ms | 0.057 | 0.057 | 0.0047ms | 0.0048ms |
| form_submission_batch (5 invoke with FormData) | cpu | 0.08ms | 0.09ms | 0.0044ms | 0.055 | 0.041 | 0.0045ms | 0.0033ms |
| action_error_handling (5 throw + catch) | cpu | 0.08ms | 0.08ms | 0.02ms | 0.231 | 0.223 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 0.06ms | 200ms | PASS |
| form_submission_batch (5 invoke with FormData) | 0.03ms | 200ms | PASS |
| action_error_handling (5 throw + catch) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| server_action_workflow (10 invokeServerAction) | 3008 B | 0 B | 102400 B | yes | PASS |
| form_submission_batch (5 invoke with FormData) | 1592 B | 0 B | 102400 B | yes | PASS |
| action_error_handling (5 throw + catch) | -280 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### server_action_workflow (10 invokeServerAction)

# Perf Report — server_action_workflow (10 invokeServerAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0047ms |
| p50 | 0.0055ms |
| p95 | 0.0077ms |
| p99 | 0.01ms |
| mean | 0.0060ms |
| stdev | 0.0019ms |
| min | 0.0046ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0048ms | -0.000069ms | -1.44% |
| p50 | 0.0055ms | 0.0050ms | +0.00050ms | +9.89% |
| p95 | 0.0077ms | 0.02ms | -0.01ms | -58.99% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -56.55% |
| mean | 0.0060ms | 0.0078ms | -0.0018ms | -23.63% |
| min | 0.0046ms | 0.0047ms | -0.00011ms | -2.32% |
| max | 0.01ms | 0.03ms | -0.02ms | -56.17% |
| total | 0.12ms | 0.16ms | -0.04ms | -23.63% |

### form_submission_batch (5 invoke with FormData)

# Perf Report — form_submission_batch (5 invoke with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0044ms |
| p50 | 0.0050ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0059ms |
| stdev | 0.0030ms |
| min | 0.0043ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.014)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0045ms | 0.0033ms | +0.0012ms | +35.09% |
| p50 | 0.0051ms | 0.0037ms | +0.0013ms | +35.73% |
| p95 | 0.01ms | 0.0080ms | +0.0025ms | +31.04% |
| p99 | 0.02ms | 0.04ms | -0.03ms | -61.06% |
| mean | 0.0059ms | 0.0063ms | -0.00034ms | -5.48% |
| min | 0.0044ms | 0.0033ms | +0.0011ms | +32.18% |
| max | 0.02ms | 0.05ms | -0.03ms | -64.68% |
| total | 0.12ms | 0.13ms | -0.0069ms | -5.48% |

### action_error_handling (5 throw + catch)

# Perf Report — action_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0035ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.022)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00067ms | +3.59% |
| p50 | 0.02ms | 0.02ms | +0.00073ms | +3.84% |
| p95 | 0.02ms | 0.05ms | -0.02ms | -49.40% |
| p99 | 0.03ms | 0.05ms | -0.01ms | -28.44% |
| mean | 0.02ms | 0.02ms | -0.0012ms | -5.40% |
| min | 0.02ms | 0.02ms | +0.00036ms | +1.93% |
| max | 0.04ms | 0.05ms | -0.01ms | -23.34% |
| total | 0.41ms | 0.44ms | -0.02ms | -5.40% |

