# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0031ms | 0.0086ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0072ms | 0.01ms | 100ms | 0.00050ms | PASS | regressed — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.02ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.04ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 15504 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -3560 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 440 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0036ms |
| p95 | 0.0086ms |
| p99 | 0.01ms |
| mean | 0.0048ms |
| stdev | 0.0024ms |
| min | 0.0031ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0030ms | +0.00013ms | +4.31% |
| p50 | 0.0036ms | 0.0030ms | +0.00058ms | +19.20% |
| p95 | 0.0086ms | 0.0081ms | +0.00051ms | +6.37% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -54.82% |
| mean | 0.0048ms | 0.0051ms | -0.00033ms | -6.41% |
| min | 0.0031ms | 0.0030ms | +0.00017ms | +5.65% |
| max | 0.01ms | 0.03ms | -0.02ms | -58.82% |
| total | 0.10ms | 0.10ms | -0.0065ms | -6.41% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0085ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0027ms |
| min | 0.0067ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0059ms | +0.0013ms | +21.84% |
| p50 | 0.0085ms | 0.0081ms | +0.00048ms | +5.95% |
| p95 | 0.01ms | 0.01ms | +0.0025ms | +20.15% |
| p99 | 0.02ms | 0.02ms | +0.00067ms | +4.08% |
| mean | 0.0094ms | 0.0081ms | +0.0013ms | +15.75% |
| min | 0.0067ms | 0.0059ms | +0.00079ms | +13.48% |
| max | 0.02ms | 0.02ms | +0.00021ms | +1.20% |
| total | 0.19ms | 0.16ms | +0.03ms | +15.75% |

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
| stdev | 0.0031ms |
| min | 0.02ms |
| max | 0.03ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0011ms | +7.12% |
| p50 | 0.02ms | 0.02ms | +0.0011ms | +6.85% |
| p95 | 0.02ms | 0.04ms | -0.01ms | -32.05% |
| p99 | 0.03ms | 0.05ms | -0.02ms | -43.22% |
| mean | 0.02ms | 0.02ms | -0.0017ms | -8.59% |
| min | 0.02ms | 0.01ms | +0.0014ms | +9.80% |
| max | 0.03ms | 0.05ms | -0.02ms | -45.26% |
| total | 0.36ms | 0.40ms | -0.03ms | -8.59% |

