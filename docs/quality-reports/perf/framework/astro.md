# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0077ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.14ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -108952 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -10448 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0097ms |
| max | 0.10ms |
| total | 3.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00013ms | -1.15% |
| p50 | 0.01ms | 0.01ms | -0.00023ms | -1.88% |
| p95 | 0.03ms | 0.03ms | -0.00023ms | -0.81% |
| p99 | 0.07ms | 0.07ms | +0.0028ms | +4.15% |
| mean | 0.02ms | 0.02ms | -0.00021ms | -1.37% |
| min | 0.0097ms | 0.0096ms | +0.000083ms | +0.86% |
| max | 0.10ms | 0.10ms | +0.0046ms | +4.83% |
| total | 3.05ms | 3.10ms | -0.04ms | -1.37% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0080ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0088ms |
| min | 0.0076ms |
| max | 0.12ms |
| total | 1.82ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0077ms | 0.00ms | 0.00% |
| p50 | 0.0080ms | 0.0080ms | +0.0000010ms | +0.01% |
| p95 | 0.01ms | 0.0091ms | +0.00094ms | +10.30% |
| p99 | 0.02ms | 0.02ms | +0.0066ms | +40.48% |
| mean | 0.0091ms | 0.0083ms | +0.00079ms | +9.55% |
| min | 0.0076ms | 0.0076ms | -0.000042ms | -0.55% |
| max | 0.12ms | 0.02ms | +0.10ms | +447.12% |
| total | 1.82ms | 1.66ms | +0.16ms | +9.55% |

