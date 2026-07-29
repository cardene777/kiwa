# Perf Suite — date-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.0028ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 -7% (閾値未満)、 p95 +53% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| format_parse_batch (5 format + parse round-trip) | 0.0059ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| parse_error_handling (5 invalid string throw + catch) | 0.01ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 0.03ms | 200ms | PASS |
| format_parse_batch (5 format + parse round-trip) | 0.03ms | 200ms | PASS |
| parse_error_handling (5 invalid string throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| multi_provider_workflow (10 arithmetic across 4 providers) | 11200 B | 0 B | 102400 B | yes | PASS |
| format_parse_batch (5 format + parse round-trip) | -2496 B | 0 B | 102400 B | yes | PASS |
| parse_error_handling (5 invalid string throw + catch) | 216 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### multi_provider_workflow (10 arithmetic across 4 providers)

# Perf Report — multi_provider_workflow (10 arithmetic across 4 providers).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0028ms |
| p50 | 0.0042ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0049ms |
| stdev | 0.0032ms |
| min | 0.0027ms |
| max | 0.01ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0028ms | 0.0030ms | -0.00021ms | -6.97% |
| p50 | 0.0042ms | 0.0030ms | +0.0012ms | +39.06% |
| p95 | 0.01ms | 0.0081ms | +0.0043ms | +52.84% |
| p99 | 0.01ms | 0.03ms | -0.01ms | -45.15% |
| mean | 0.0049ms | 0.0051ms | -0.00024ms | -4.74% |
| min | 0.0027ms | 0.0030ms | -0.00021ms | -7.03% |
| max | 0.01ms | 0.03ms | -0.02ms | -51.55% |
| total | 0.10ms | 0.10ms | -0.0048ms | -4.74% |

### format_parse_batch (5 format + parse round-trip)

# Perf Report — format_parse_batch (5 format + parse round-trip).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0059ms |
| p50 | 0.0068ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0080ms |
| stdev | 0.0033ms |
| min | 0.0057ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0059ms | +0.000029ms | +0.50% |
| p50 | 0.0068ms | 0.0081ms | -0.0013ms | -16.27% |
| p95 | 0.01ms | 0.01ms | +0.00063ms | +5.06% |
| p99 | 0.02ms | 0.02ms | +0.0026ms | +15.85% |
| mean | 0.0080ms | 0.0081ms | -0.00011ms | -1.36% |
| min | 0.0057ms | 0.0059ms | -0.00017ms | -2.84% |
| max | 0.02ms | 0.02ms | +0.0031ms | +17.79% |
| total | 0.16ms | 0.16ms | -0.0022ms | -1.36% |

### parse_error_handling (5 invalid string throw + catch)

# Perf Report — parse_error_handling (5 invalid string throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.0017ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.00057ms | -3.76% |
| p50 | 0.01ms | 0.02ms | -0.00058ms | -3.76% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -46.22% |
| p99 | 0.02ms | 0.05ms | -0.03ms | -56.66% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -19.68% |
| min | 0.01ms | 0.01ms | +0.0000010ms | +0.01% |
| max | 0.02ms | 0.05ms | -0.03ms | -58.56% |
| total | 0.32ms | 0.40ms | -0.08ms | -19.68% |

