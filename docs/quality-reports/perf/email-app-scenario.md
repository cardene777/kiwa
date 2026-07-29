# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0035ms | 0.0098ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0037ms | 0.0042ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| transactional_send_workflow (10 send across 4 providers) | 8520 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -960 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 12184 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0048ms |
| p95 | 0.0098ms |
| p99 | 0.01ms |
| mean | 0.0050ms |
| stdev | 0.0019ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0049ms | -0.0014ms | -28.83% |
| p50 | 0.0048ms | 0.0050ms | -0.00021ms | -4.13% |
| p95 | 0.0098ms | 0.0063ms | +0.0035ms | +56.07% |
| p99 | 0.01ms | 0.0066ms | +0.0037ms | +57.01% |
| mean | 0.0050ms | 0.0052ms | -0.00019ms | -3.54% |
| min | 0.0034ms | 0.0049ms | -0.0015ms | -29.91% |
| max | 0.01ms | 0.0066ms | +0.0038ms | +57.24% |
| total | 0.10ms | 0.10ms | -0.0037ms | -3.54% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0037ms |
| p95 | 0.0042ms |
| p99 | 0.0054ms |
| mean | 0.0039ms |
| stdev | 0.00046ms |
| min | 0.0037ms |
| max | 0.0057ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0038ms | -0.00017ms | -4.33% |
| p50 | 0.0037ms | 0.0040ms | -0.00021ms | -5.26% |
| p95 | 0.0042ms | 0.0049ms | -0.00065ms | -13.34% |
| p99 | 0.0054ms | 0.0059ms | -0.00043ms | -7.32% |
| mean | 0.0039ms | 0.0041ms | -0.00024ms | -5.91% |
| min | 0.0037ms | 0.0038ms | -0.00017ms | -4.36% |
| max | 0.0057ms | 0.0061ms | -0.00038ms | -6.12% |
| total | 0.08ms | 0.08ms | -0.0049ms | -5.91% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0069ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.52ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0045ms | -17.24% |
| p50 | 0.02ms | 0.03ms | -0.0030ms | -11.15% |
| p95 | 0.03ms | 0.04ms | -0.0056ms | -14.59% |
| p99 | 0.05ms | 0.04ms | +0.0090ms | +22.91% |
| mean | 0.03ms | 0.03ms | -0.0032ms | -10.87% |
| min | 0.02ms | 0.03ms | -0.0040ms | -15.77% |
| max | 0.05ms | 0.04ms | +0.01ms | +32.01% |
| total | 0.52ms | 0.59ms | -0.06ms | -10.87% |

