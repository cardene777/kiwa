# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0040ms | 0.0094ms | 100ms | 0.00050ms | PASS | stable (p10 -18% (閾値未満)、 p95 +50% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0037ms | 0.0054ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -31768 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -3640 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 12088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0040ms |
| p50 | 0.0049ms |
| p95 | 0.0094ms |
| p99 | 0.01ms |
| mean | 0.0053ms |
| stdev | 0.0017ms |
| min | 0.0036ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0040ms | 0.0049ms | -0.00087ms | -17.64% |
| p50 | 0.0049ms | 0.0050ms | -0.00017ms | -3.30% |
| p95 | 0.0094ms | 0.0063ms | +0.0031ms | +49.55% |
| p99 | 0.01ms | 0.0066ms | +0.0035ms | +52.71% |
| mean | 0.0053ms | 0.0052ms | +0.000058ms | +1.12% |
| min | 0.0036ms | 0.0049ms | -0.0013ms | -26.50% |
| max | 0.01ms | 0.0066ms | +0.0035ms | +53.46% |
| total | 0.11ms | 0.10ms | +0.0012ms | +1.12% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0046ms |
| p95 | 0.0054ms |
| p99 | 0.0058ms |
| mean | 0.0045ms |
| stdev | 0.00066ms |
| min | 0.0037ms |
| max | 0.0059ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0038ms | -0.00013ms | -3.37% |
| p50 | 0.0046ms | 0.0040ms | +0.00069ms | +17.38% |
| p95 | 0.0054ms | 0.0049ms | +0.00050ms | +10.28% |
| p99 | 0.0058ms | 0.0059ms | -0.000066ms | -1.12% |
| mean | 0.0045ms | 0.0041ms | +0.00039ms | +9.40% |
| min | 0.0037ms | 0.0038ms | -0.00017ms | -4.36% |
| max | 0.0059ms | 0.0061ms | -0.00021ms | -3.40% |
| total | 0.09ms | 0.08ms | +0.0078ms | +9.40% |

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
| stdev | 0.0060ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0046ms | -17.62% |
| p50 | 0.02ms | 0.03ms | -0.0038ms | -14.07% |
| p95 | 0.04ms | 0.04ms | -0.00098ms | -2.54% |
| p99 | 0.04ms | 0.04ms | -0.000029ms | -0.07% |
| mean | 0.03ms | 0.03ms | -0.0031ms | -10.42% |
| min | 0.02ms | 0.03ms | -0.0045ms | -17.56% |
| max | 0.04ms | 0.04ms | +0.00021ms | +0.52% |
| total | 0.52ms | 0.59ms | -0.06ms | -10.42% |

