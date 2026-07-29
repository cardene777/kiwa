# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0029ms | 0.0064ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0061ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 12304 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0042ms |
| p95 | 0.0064ms |
| p99 | 0.01ms |
| mean | 0.0044ms |
| stdev | 0.0019ms |
| min | 0.0029ms |
| max | 0.01ms |
| total | 0.09ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.000079ms | -2.63% |
| p50 | 0.0042ms | 0.0030ms | +0.0011ms | +37.68% |
| p95 | 0.0064ms | 0.0081ms | -0.0017ms | -21.17% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -61.82% |
| mean | 0.0044ms | 0.0051ms | -0.00074ms | -14.42% |
| min | 0.0029ms | 0.0030ms | -0.000041ms | -1.39% |
| max | 0.01ms | 0.03ms | -0.02ms | -64.47% |
| total | 0.09ms | 0.10ms | -0.01ms | -14.42% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0061ms |
| p50 | 0.0070ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0082ms |
| stdev | 0.0024ms |
| min | 0.0060ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0061ms | 0.0059ms | +0.00020ms | +3.45% |
| p50 | 0.0070ms | 0.0081ms | -0.0011ms | -13.69% |
| p95 | 0.01ms | 0.01ms | +0.00031ms | +2.50% |
| p99 | 0.01ms | 0.02ms | -0.0026ms | -15.73% |
| mean | 0.0082ms | 0.0081ms | +0.00013ms | +1.64% |
| min | 0.0060ms | 0.0059ms | +0.00013ms | +2.13% |
| max | 0.01ms | 0.02ms | -0.0033ms | -19.00% |
| total | 0.16ms | 0.16ms | +0.0027ms | +1.64% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0039ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00028ms | -1.82% |
| p50 | 0.02ms | 0.02ms | -0.00013ms | -0.81% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -39.57% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -36.21% |
| mean | 0.02ms | 0.02ms | -0.0030ms | -14.94% |
| min | 0.01ms | 0.01ms | +0.00021ms | +1.45% |
| max | 0.03ms | 0.05ms | -0.02ms | -35.60% |
| total | 0.34ms | 0.40ms | -0.06ms | -14.94% |

