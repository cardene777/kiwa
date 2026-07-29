# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0029ms | 0.0064ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0071ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.02ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 7400 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2416 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | -200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0050ms |
| p95 | 0.0064ms |
| p99 | 0.0093ms |
| mean | 0.0045ms |
| stdev | 0.0018ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.000079ms | -2.63% |
| p50 | 0.0050ms | 0.0030ms | +0.0019ms | +63.70% |
| p95 | 0.0064ms | 0.0081ms | -0.0017ms | -21.30% |
| p99 | 0.0093ms | 0.03ms | -0.02ms | -64.86% |
| mean | 0.0045ms | 0.0051ms | -0.00062ms | -12.09% |
| min | 0.0029ms | 0.0030ms | -0.000041ms | -1.39% |
| max | 0.01ms | 0.03ms | -0.02ms | -67.70% |
| total | 0.09ms | 0.10ms | -0.01ms | -12.09% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0071ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0086ms |
| stdev | 0.0017ms |
| min | 0.0063ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0071ms | 0.0059ms | +0.0012ms | +19.58% |
| p50 | 0.0079ms | 0.0081ms | -0.00013ms | -1.55% |
| p95 | 0.01ms | 0.01ms | -0.00064ms | -5.13% |
| p99 | 0.01ms | 0.02ms | -0.0040ms | -24.43% |
| mean | 0.0086ms | 0.0081ms | +0.00049ms | +6.06% |
| min | 0.0063ms | 0.0059ms | +0.00042ms | +7.08% |
| max | 0.01ms | 0.02ms | -0.0048ms | -27.89% |
| total | 0.17ms | 0.16ms | +0.0098ms | +6.06% |

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
| stdev | 0.0034ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.000017ms | +0.11% |
| p50 | 0.02ms | 0.02ms | +0.00015ms | +0.94% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -38.94% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -40.70% |
| mean | 0.02ms | 0.02ms | -0.0028ms | -13.94% |
| min | 0.02ms | 0.01ms | +0.00058ms | +4.04% |
| max | 0.03ms | 0.05ms | -0.02ms | -41.02% |
| total | 0.34ms | 0.40ms | -0.06ms | -13.94% |

