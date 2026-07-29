# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0035ms | 0.0064ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0039ms | 0.0063ms | 100ms | 0.00050ms | PASS | stable (p10 +1% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.04ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -40344 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -928 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 11696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0047ms |
| p95 | 0.0064ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0019ms |
| min | 0.0035ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0049ms | -0.0014ms | -27.97% |
| p50 | 0.0047ms | 0.0050ms | -0.00037ms | -7.43% |
| p95 | 0.0064ms | 0.0063ms | +0.00016ms | +2.63% |
| p99 | 0.01ms | 0.0066ms | +0.0046ms | +69.68% |
| mean | 0.0049ms | 0.0052ms | -0.00033ms | -6.37% |
| min | 0.0035ms | 0.0049ms | -0.0014ms | -28.21% |
| max | 0.01ms | 0.0066ms | +0.0057ms | +85.54% |
| total | 0.10ms | 0.10ms | -0.0067ms | -6.37% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0039ms |
| p50 | 0.0040ms |
| p95 | 0.0063ms |
| p99 | 0.0070ms |
| mean | 0.0045ms |
| stdev | 0.0010ms |
| min | 0.0038ms |
| max | 0.0071ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0039ms | 0.0038ms | +0.000038ms | +0.99% |
| p50 | 0.0040ms | 0.0040ms | +0.000042ms | +1.06% |
| p95 | 0.0063ms | 0.0049ms | +0.0014ms | +29.28% |
| p99 | 0.0070ms | 0.0059ms | +0.0011ms | +18.48% |
| mean | 0.0045ms | 0.0041ms | +0.00037ms | +8.89% |
| min | 0.0038ms | 0.0038ms | -0.000042ms | -1.10% |
| max | 0.0071ms | 0.0061ms | +0.0010ms | +16.33% |
| total | 0.09ms | 0.08ms | +0.0073ms | +8.89% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0063ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.55ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0023ms | -8.82% |
| p50 | 0.03ms | 0.03ms | -0.0017ms | -6.23% |
| p95 | 0.04ms | 0.04ms | +0.0041ms | +10.55% |
| p99 | 0.05ms | 0.04ms | +0.0057ms | +14.39% |
| mean | 0.03ms | 0.03ms | -0.0016ms | -5.34% |
| min | 0.02ms | 0.03ms | -0.0019ms | -7.48% |
| max | 0.05ms | 0.04ms | +0.0061ms | +15.32% |
| total | 0.55ms | 0.59ms | -0.03ms | -5.34% |

