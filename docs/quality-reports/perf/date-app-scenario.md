# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0049ms | 0.0061ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0081ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.04ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 14192 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0049ms |
| p50 | 0.0049ms |
| p95 | 0.0061ms |
| p99 | 0.0066ms |
| mean | 0.0051ms |
| stdev | 0.00047ms |
| min | 0.0048ms |
| max | 0.0067ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0049ms | 0.0030ms | +0.0019ms | +62.45% |
| p50 | 0.0049ms | 0.0030ms | +0.0019ms | +62.35% |
| p95 | 0.0061ms | 0.0081ms | -0.0020ms | -24.35% |
| p99 | 0.0066ms | 0.03ms | -0.02ms | -75.15% |
| mean | 0.0051ms | 0.0051ms | +0.0000042ms | +0.08% |
| min | 0.0048ms | 0.0030ms | +0.0018ms | +62.00% |
| max | 0.0067ms | 0.03ms | -0.02ms | -78.47% |
| total | 0.10ms | 0.10ms | +0.000084ms | +0.08% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0081ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0096ms |
| stdev | 0.0020ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0081ms | 0.0059ms | +0.0021ms | +36.28% |
| p50 | 0.0091ms | 0.0081ms | +0.0010ms | +12.66% |
| p95 | 0.01ms | 0.01ms | -0.00080ms | -6.42% |
| p99 | 0.02ms | 0.02ms | -0.00026ms | -1.59% |
| mean | 0.0096ms | 0.0081ms | +0.0015ms | +18.85% |
| min | 0.0078ms | 0.0059ms | +0.0019ms | +32.61% |
| max | 0.02ms | 0.02ms | -0.00013ms | -0.73% |
| total | 0.19ms | 0.16ms | +0.03ms | +18.85% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0026ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00016ms | -1.05% |
| p50 | 0.02ms | 0.02ms | -0.000041ms | -0.27% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -40.76% |
| p99 | 0.02ms | 0.05ms | -0.02ms | -49.80% |
| mean | 0.02ms | 0.02ms | -0.0031ms | -15.84% |
| min | 0.01ms | 0.01ms | +0.00013ms | +0.86% |
| max | 0.02ms | 0.05ms | -0.03ms | -51.44% |
| total | 0.33ms | 0.40ms | -0.06ms | -15.84% |

