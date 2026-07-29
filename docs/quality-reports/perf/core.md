# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.02ms | 5ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| createPool | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11342%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.09ms | 10ms | PASS |
| createPool | 0.06ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 2800 B | 0 B | 102400 B | yes | PASS |
| createPool | -16224 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 1.96ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +55.32% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +109.37% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +118.33% |
| mean | 0.01ms | 0.01ms | +0.00ms | +75.59% |
| min | 0.01ms | 0.00ms | +0.00ms | +42.32% |
| max | 0.07ms | 0.10ms | -0.04ms | -35.38% |
| total | 1.96ms | 1.12ms | +0.84ms | +75.59% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.03ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.90% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +2.69% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +25.54% |
| mean | 0.00ms | 0.00ms | -0.00ms | -19.68% |
| min | 0.00ms | 0.00ms | +0.00ms | +6.64% |
| max | 0.05ms | 0.28ms | -0.23ms | -81.57% |
| total | 0.60ms | 0.75ms | -0.15ms | -19.68% |

