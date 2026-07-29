# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0029ms | 0.0071ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0060ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.07ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 12832 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 696 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0049ms |
| p95 | 0.0071ms |
| p99 | 0.01ms |
| mean | 0.0046ms |
| stdev | 0.0022ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.000084ms | -2.80% |
| p50 | 0.0049ms | 0.0030ms | +0.0018ms | +59.61% |
| p95 | 0.0071ms | 0.0081ms | -0.00094ms | -11.68% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -57.95% |
| mean | 0.0046ms | 0.0051ms | -0.00050ms | -9.88% |
| min | 0.0029ms | 0.0030ms | -0.000083ms | -2.81% |
| max | 0.01ms | 0.03ms | -0.02ms | -60.97% |
| total | 0.09ms | 0.10ms | -0.01ms | -9.88% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0060ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0079ms |
| stdev | 0.0021ms |
| min | 0.0059ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0059ms | +0.000041ms | +0.70% |
| p50 | 0.0070ms | 0.0081ms | -0.0011ms | -13.18% |
| p95 | 0.01ms | 0.01ms | +0.00053ms | +4.30% |
| p99 | 0.01ms | 0.02ms | -0.0034ms | -20.55% |
| mean | 0.0079ms | 0.0081ms | -0.00025ms | -3.11% |
| min | 0.0059ms | 0.0059ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0043ms | -25.00% |
| total | 0.16ms | 0.16ms | -0.0050ms | -3.11% |

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
| stdev | 0.0032ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.000029ms | -0.19% |
| p50 | 0.02ms | 0.02ms | +0.00081ms | +5.25% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -38.46% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -42.85% |
| mean | 0.02ms | 0.02ms | -0.0024ms | -12.23% |
| min | 0.01ms | 0.01ms | +0.00038ms | +2.59% |
| max | 0.03ms | 0.05ms | -0.02ms | -43.65% |
| total | 0.35ms | 0.40ms | -0.05ms | -12.23% |

