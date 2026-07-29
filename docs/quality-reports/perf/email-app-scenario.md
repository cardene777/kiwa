# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0035ms | 0.0064ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0037ms | 0.0055ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.10ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -7752 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -3096 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | -155960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0049ms |
| p95 | 0.0064ms |
| p99 | 0.0097ms |
| mean | 0.0049ms |
| stdev | 0.0016ms |
| min | 0.0035ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0049ms | -0.0014ms | -27.89% |
| p50 | 0.0049ms | 0.0050ms | -0.00010ms | -2.06% |
| p95 | 0.0064ms | 0.0063ms | +0.00012ms | +1.90% |
| p99 | 0.0097ms | 0.0066ms | +0.0032ms | +48.68% |
| mean | 0.0049ms | 0.0052ms | -0.00034ms | -6.49% |
| min | 0.0035ms | 0.0049ms | -0.0014ms | -28.21% |
| max | 0.01ms | 0.0066ms | +0.0040ms | +59.74% |
| total | 0.10ms | 0.10ms | -0.0068ms | -6.49% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0042ms |
| p95 | 0.0055ms |
| p99 | 0.0056ms |
| mean | 0.0043ms |
| stdev | 0.00065ms |
| min | 0.0037ms |
| max | 0.0056ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0038ms | -0.00013ms | -3.37% |
| p50 | 0.0042ms | 0.0040ms | +0.00021ms | +5.27% |
| p95 | 0.0055ms | 0.0049ms | +0.00061ms | +12.41% |
| p99 | 0.0056ms | 0.0059ms | -0.00028ms | -4.74% |
| mean | 0.0043ms | 0.0041ms | +0.00021ms | +5.20% |
| min | 0.0037ms | 0.0038ms | -0.00017ms | -4.36% |
| max | 0.0056ms | 0.0061ms | -0.00050ms | -8.16% |
| total | 0.09ms | 0.08ms | +0.0043ms | +5.20% |

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
| stdev | 0.0059ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.51ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0048ms | -18.35% |
| p50 | 0.02ms | 0.03ms | -0.0043ms | -15.99% |
| p95 | 0.04ms | 0.04ms | -0.00047ms | -1.23% |
| p99 | 0.04ms | 0.04ms | -0.00073ms | -1.84% |
| mean | 0.03ms | 0.03ms | -0.0037ms | -12.69% |
| min | 0.02ms | 0.03ms | -0.0045ms | -17.56% |
| max | 0.04ms | 0.04ms | -0.00079ms | -1.99% |
| total | 0.51ms | 0.59ms | -0.07ms | -12.69% |

