# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0030ms | 0.0067ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0067ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | -192640 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 296 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0048ms |
| p95 | 0.0067ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0020ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000042ms | -1.40% |
| p50 | 0.0048ms | 0.0030ms | +0.0017ms | +56.86% |
| p95 | 0.0067ms | 0.0081ms | -0.0014ms | -17.40% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -59.94% |
| mean | 0.0046ms | 0.0051ms | -0.00054ms | -10.54% |
| min | 0.0029ms | 0.0030ms | -0.000041ms | -1.39% |
| max | 0.01ms | 0.03ms | -0.02ms | -62.72% |
| total | 0.09ms | 0.10ms | -0.01ms | -10.54% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0067ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0085ms |
| stdev | 0.0029ms |
| min | 0.0058ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0059ms | +0.00077ms | +12.96% |
| p50 | 0.0076ms | 0.0081ms | -0.00048ms | -5.94% |
| p95 | 0.01ms | 0.01ms | +0.0024ms | +19.33% |
| p99 | 0.02ms | 0.02ms | +0.00091ms | +5.58% |
| mean | 0.0085ms | 0.0081ms | +0.00037ms | +4.55% |
| min | 0.0058ms | 0.0059ms | -0.000042ms | -0.71% |
| max | 0.02ms | 0.02ms | +0.00054ms | +3.12% |
| total | 0.17ms | 0.16ms | +0.0074ms | +4.55% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0036ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00014ms | +0.91% |
| p50 | 0.02ms | 0.02ms | +0.00023ms | +1.48% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -31.46% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -42.70% |
| mean | 0.02ms | 0.02ms | -0.0020ms | -10.12% |
| min | 0.02ms | 0.01ms | +0.00058ms | +4.04% |
| max | 0.03ms | 0.05ms | -0.02ms | -44.75% |
| total | 0.36ms | 0.40ms | -0.04ms | -10.12% |

