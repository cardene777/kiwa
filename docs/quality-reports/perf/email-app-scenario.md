# Perf Suite — email-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.0035ms | 0.0069ms | 100ms | 0.00050ms | PASS | improved — gate 無効 (regressionGate=false) |
| template_render_batch (5 render with data) | 0.0037ms | 0.0046ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| webhook_verify_delivery_batch (5 verify + parse) | 0.02ms | 0.05ms | 100ms | 0.00050ms | PASS | stable (p10 -15% (閾値未満)、 p95 +36% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | 0.02ms | 200ms | PASS |
| template_render_batch (5 render with data) | 0.02ms | 200ms | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 0.15ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| transactional_send_workflow (10 send across 4 providers) | -22160 B | 0 B | 102400 B | yes | PASS |
| template_render_batch (5 render with data) | -272 B | 0 B | 102400 B | yes | PASS |
| webhook_verify_delivery_batch (5 verify + parse) | 11800 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### transactional_send_workflow (10 send across 4 providers)

# Perf Report — transactional_send_workflow (10 send across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0035ms |
| p50 | 0.0048ms |
| p95 | 0.0069ms |
| p99 | 0.0098ms |
| mean | 0.0049ms |
| stdev | 0.0016ms |
| min | 0.0034ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0035ms | 0.0049ms | -0.0015ms | -29.69% |
| p50 | 0.0048ms | 0.0050ms | -0.00023ms | -4.55% |
| p95 | 0.0069ms | 0.0063ms | +0.00067ms | +10.67% |
| p99 | 0.0098ms | 0.0066ms | +0.0032ms | +49.34% |
| mean | 0.0049ms | 0.0052ms | -0.00030ms | -5.65% |
| min | 0.0034ms | 0.0049ms | -0.0015ms | -30.77% |
| max | 0.01ms | 0.0066ms | +0.0039ms | +58.49% |
| total | 0.10ms | 0.10ms | -0.0059ms | -5.65% |

### template_render_batch (5 render with data)

# Perf Report — template_render_batch (5 render with data).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0037ms |
| p50 | 0.0038ms |
| p95 | 0.0046ms |
| p99 | 0.0054ms |
| mean | 0.0040ms |
| stdev | 0.00042ms |
| min | 0.0037ms |
| max | 0.0055ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0037ms | 0.0038ms | -0.000083ms | -2.17% |
| p50 | 0.0038ms | 0.0040ms | -0.00012ms | -3.16% |
| p95 | 0.0046ms | 0.0049ms | -0.00031ms | -6.28% |
| p99 | 0.0054ms | 0.0059ms | -0.00053ms | -8.99% |
| mean | 0.0040ms | 0.0041ms | -0.00018ms | -4.24% |
| min | 0.0037ms | 0.0038ms | -0.000083ms | -2.17% |
| max | 0.0055ms | 0.0061ms | -0.00058ms | -9.53% |
| total | 0.08ms | 0.08ms | -0.0035ms | -4.24% |

### webhook_verify_delivery_batch (5 verify + parse)

# Perf Report — webhook_verify_delivery_batch (5 verify + parse).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.15ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.18ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.03ms | -0.0038ms | -14.61% |
| p50 | 0.02ms | 0.03ms | -0.0031ms | -11.45% |
| p95 | 0.05ms | 0.04ms | +0.01ms | +35.73% |
| p99 | 0.15ms | 0.04ms | +0.11ms | +285.66% |
| mean | 0.03ms | 0.03ms | +0.0055ms | +18.74% |
| min | 0.02ms | 0.03ms | -0.0036ms | -13.99% |
| max | 0.18ms | 0.04ms | +0.14ms | +346.28% |
| total | 0.70ms | 0.59ms | +0.11ms | +18.74% |

