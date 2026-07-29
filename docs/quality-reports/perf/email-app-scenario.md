# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0035ms | 0.0061ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0038ms | 0.0055ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.03ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 1224 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -2808 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 12088 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0046ms |
| p95 | 0.0061ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0017ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0049ms | -0.0015ms | -29.60% |
| p50 | 0.0046ms | 0.0050ms | -0.00042ms | -8.26% |
| p95 | 0.0061ms | 0.0063ms | -0.00013ms | -2.13% |
| p99 | 0.01ms | 0.0066ms | +0.0035ms | +54.01% |
| mean | 0.0046ms | 0.0052ms | -0.00059ms | -11.31% |
| min | 0.0034ms | 0.0049ms | -0.0015ms | -29.93% |
| max | 0.01ms | 0.0066ms | +0.0045ms | +67.29% |
| total | 0.09ms | 0.10ms | -0.01ms | -11.31% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0038ms |
| p50 | 0.0045ms |
| p95 | 0.0055ms |
| p99 | 0.0067ms |
| mean | 0.0046ms |
| stdev | 0.00073ms |
| min | 0.0038ms |
| max | 0.0070ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0038ms | 0.0038ms | -0.0000041ms | -0.11% |
| p50 | 0.0045ms | 0.0040ms | +0.00052ms | +13.16% |
| p95 | 0.0055ms | 0.0049ms | +0.00056ms | +11.39% |
| p99 | 0.0067ms | 0.0059ms | +0.00081ms | +13.80% |
| mean | 0.0046ms | 0.0041ms | +0.00046ms | +11.21% |
| min | 0.0038ms | 0.0038ms | -0.000041ms | -1.07% |
| max | 0.0070ms | 0.0061ms | +0.00087ms | +14.29% |
| total | 0.09ms | 0.08ms | +0.0093ms | +11.21% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0056ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0044ms | -17.00% |
| p50 | 0.02ms | 0.03ms | -0.0044ms | -16.29% |
| p95 | 0.03ms | 0.04ms | -0.0050ms | -13.11% |
| p99 | 0.04ms | 0.04ms | +0.0031ms | +7.75% |
| mean | 0.02ms | 0.03ms | -0.0044ms | -15.01% |
| min | 0.02ms | 0.03ms | -0.0045ms | -17.40% |
| max | 0.04ms | 0.04ms | +0.0051ms | +12.80% |
| total | 0.50ms | 0.59ms | -0.09ms | -15.01% |

