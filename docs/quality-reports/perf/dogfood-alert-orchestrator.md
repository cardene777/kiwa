# Perf Suite — dogfood-alert-orchestrator

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| evaluateRules | 0.0020ms | 0.0056ms | 30ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| routeAlert | 0.0010ms | 0.0039ms | 20ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| advanceEscalation | 0.0010ms | 0.0035ms | 20ms | 0.00033ms | PASS | improved — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateRules | 0.03ms | 60ms | PASS |
| routeAlert | 0.01ms | 40ms | PASS |
| advanceEscalation | 0.02ms | 40ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateRules | 6536 B | 0 B | 102400 B | yes | PASS |
| routeAlert | 31336 B | 0 B | 102400 B | yes | PASS |
| advanceEscalation | 32592 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateRules

# Perf Report — evaluateRules.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0056ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0026ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0021ms | -0.000079ms | -3.72% |
| p50 | 0.0021ms | 0.0021ms | -0.000021ms | -0.96% |
| p95 | 0.0056ms | 0.0055ms | +0.000050ms | +0.91% |
| p99 | 0.01ms | 0.01ms | +0.00097ms | +7.96% |
| mean | 0.0031ms | 0.0031ms | +0.000061ms | +2.01% |
| min | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| max | 0.02ms | 0.02ms | +0.0015ms | +8.96% |
| total | 0.13ms | 0.12ms | +0.0025ms | +2.01% |

### routeAlert

# Perf Report — routeAlert.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0039ms |
| p99 | 0.0059ms |
| mean | 0.0014ms |
| stdev | 0.0011ms |
| min | 0.0010ms |
| max | 0.0069ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000042ms | +4.38% |
| p50 | 0.0010ms | 0.0010ms | +0.0000010ms | +0.10% |
| p95 | 0.0039ms | 0.0035ms | +0.00042ms | +11.82% |
| p99 | 0.0059ms | 0.0049ms | +0.0011ms | +21.64% |
| mean | 0.0014ms | 0.0014ms | +0.000067ms | +4.91% |
| min | 0.0010ms | 0.00096ms | +0.000042ms | +4.38% |
| max | 0.0069ms | 0.0055ms | +0.0015ms | +26.69% |
| total | 0.06ms | 0.05ms | +0.0027ms | +4.91% |

### advanceEscalation

# Perf Report — advanceEscalation.serial

| metric | value |
|---|---|
| iterations | 40 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0035ms |
| p99 | 0.0077ms |
| mean | 0.0017ms |
| stdev | 0.0015ms |
| min | 0.0010ms |
| max | 0.0092ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0014ms | -0.00037ms | -26.41% |
| p50 | 0.0011ms | 0.0015ms | -0.00031ms | -21.43% |
| p95 | 0.0035ms | 0.0027ms | +0.00080ms | +29.66% |
| p99 | 0.0077ms | 0.0041ms | +0.0036ms | +89.64% |
| mean | 0.0017ms | 0.0017ms | +0.0000052ms | +0.31% |
| min | 0.0010ms | 0.0014ms | -0.00033ms | -24.29% |
| max | 0.0092ms | 0.0043ms | +0.0049ms | +115.69% |
| total | 0.07ms | 0.07ms | +0.00021ms | +0.31% |

