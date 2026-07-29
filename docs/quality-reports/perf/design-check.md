# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| checkSpecConformance | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +10208%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.04ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.03ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -25096 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -2664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.26% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.39% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +22.02% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.63% |
| min | 0.00ms | 0.00ms | -0.00ms | -21.31% |
| max | 0.01ms | 0.01ms | +0.00ms | +34.57% |
| total | 0.18ms | 0.18ms | +0.00ms | +1.63% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 1.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.01ms | -57.48% |
| p95 | 0.04ms | 0.03ms | +0.01ms | +44.86% |
| p99 | 0.04ms | 0.04ms | +0.01ms | +22.52% |
| mean | 0.02ms | 0.02ms | +0.00ms | +20.61% |
| min | 0.01ms | 0.01ms | -0.00ms | -4.37% |
| max | 0.04ms | 0.04ms | +0.01ms | +21.64% |
| total | 1.01ms | 0.84ms | +0.17ms | +20.61% |

