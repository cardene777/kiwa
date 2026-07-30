# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0040ms | 0.0047ms | 100ms | 0.00047ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0036ms | 0.0056ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.04ms | 100ms | 0.00046ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | cpu | 0.09ms | 0.10ms | 0.0040ms | 0.046 | 0.048 | 0.0037ms | 0.0039ms |
| template_render_batch (5 render with data) | cpu | 0.09ms | 0.09ms | 0.0036ms | 0.042 | 0.044 | 0.0035ms | 0.0037ms |
| webhook_verify_delivery_batch (5 verify + parse) | cpu | 0.09ms | 0.09ms | 0.02ms | 0.264 | 0.266 | 0.02ms | 0.02ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.12ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -152640 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -64 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 8096 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0041ms |
| p95 | 0.0047ms |
| p99 | 0.0051ms |
| mean | 0.0042ms |
| stdev | 0.00033ms |
| min | 0.0040ms |
| max | 0.0053ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.944)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0039ms | -0.00021ms | -5.38% |
| p50 | 0.0039ms | 0.0041ms | -0.00017ms | -4.12% |
| p95 | 0.0045ms | 0.0048ms | -0.00037ms | -7.62% |
| p99 | 0.0049ms | 0.0056ms | -0.00074ms | -13.22% |
| mean | 0.0040ms | 0.0042ms | -0.00020ms | -4.68% |
| min | 0.0037ms | 0.0039ms | -0.00014ms | -3.55% |
| max | 0.0050ms | 0.0058ms | -0.00083ms | -14.40% |
| total | 0.08ms | 0.08ms | -0.0039ms | -4.68% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0036ms |
| p50 | 0.0038ms |
| p95 | 0.0056ms |
| p99 | 0.0071ms |
| mean | 0.0041ms |
| stdev | 0.00093ms |
| min | 0.0035ms |
| max | 0.0075ms |
| total | 0.08ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.963)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0037ms | -0.00018ms | -4.86% |
| p50 | 0.0036ms | 0.0038ms | -0.00018ms | -4.73% |
| p95 | 0.0054ms | 0.0061ms | -0.00070ms | -11.51% |
| p99 | 0.0068ms | 0.0088ms | -0.0020ms | -22.29% |
| mean | 0.0040ms | 0.0043ms | -0.00034ms | -7.83% |
| min | 0.0034ms | 0.0036ms | -0.00025ms | -6.99% |
| max | 0.0072ms | 0.0095ms | -0.0023ms | -24.03% |
| total | 0.08ms | 0.09ms | -0.0067ms | -7.83% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0048ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.53ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.927)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00011ms | -0.50% |
| p50 | 0.02ms | 0.02ms | +0.00052ms | +2.35% |
| p95 | 0.03ms | 0.03ms | +0.0046ms | +15.03% |
| p99 | 0.04ms | 0.03ms | +0.0051ms | +16.13% |
| mean | 0.02ms | 0.02ms | +0.00038ms | +1.57% |
| min | 0.02ms | 0.02ms | -0.00035ms | -1.66% |
| max | 0.04ms | 0.03ms | +0.0052ms | +16.40% |
| total | 0.49ms | 0.48ms | +0.0076ms | +1.57% |

