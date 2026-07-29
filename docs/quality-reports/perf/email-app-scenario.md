# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00058ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0054ms | 0.0068ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0042ms | 0.0050ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.04ms | 100ms | 0.00058ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.03ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.11ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 3664 B | -12422 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -96 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 13248 B | -32768 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0054ms |
| p50 | 0.0054ms |
| p95 | 0.0068ms |
| p99 | 0.0069ms |
| mean | 0.0056ms |
| stdev | 0.00045ms |
| min | 0.0053ms |
| max | 0.0069ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0054ms | 0.0049ms | +0.00046ms | +9.43% |
| p50 | 0.0054ms | 0.0050ms | +0.00038ms | +7.45% |
| p95 | 0.0068ms | 0.0063ms | +0.00049ms | +7.81% |
| p99 | 0.0069ms | 0.0066ms | +0.00033ms | +5.06% |
| mean | 0.0056ms | 0.0052ms | +0.00036ms | +6.98% |
| min | 0.0053ms | 0.0049ms | +0.00042ms | +8.55% |
| max | 0.0069ms | 0.0066ms | +0.00029ms | +4.41% |
| total | 0.11ms | 0.10ms | +0.0073ms | +6.98% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0042ms |
| p50 | 0.0043ms |
| p95 | 0.0050ms |
| p99 | 0.0066ms |
| mean | 0.0045ms |
| stdev | 0.00062ms |
| min | 0.0041ms |
| max | 0.0070ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0042ms | 0.0038ms | +0.00033ms | +8.71% |
| p50 | 0.0043ms | 0.0040ms | +0.00033ms | +8.44% |
| p95 | 0.0050ms | 0.0049ms | +0.000083ms | +1.69% |
| p99 | 0.0066ms | 0.0059ms | +0.00072ms | +12.19% |
| mean | 0.0045ms | 0.0041ms | +0.00035ms | +8.49% |
| min | 0.0041ms | 0.0038ms | +0.00029ms | +7.62% |
| max | 0.0070ms | 0.0061ms | +0.00087ms | +14.29% |
| total | 0.09ms | 0.08ms | +0.0070ms | +8.49% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.03ms |
| stdev | 0.0065ms |
| min | 0.02ms |
| max | 0.05ms |
| total | 0.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0036ms | -13.78% |
| p50 | 0.02ms | 0.03ms | -0.0032ms | -11.99% |
| p95 | 0.04ms | 0.04ms | -0.0032ms | -8.35% |
| p99 | 0.05ms | 0.04ms | +0.0074ms | +18.81% |
| mean | 0.03ms | 0.03ms | -0.0029ms | -9.78% |
| min | 0.02ms | 0.03ms | -0.0036ms | -13.98% |
| max | 0.05ms | 0.04ms | +0.01ms | +25.39% |
| total | 0.53ms | 0.59ms | -0.06ms | -9.78% |

