# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.01ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +5411%) 以上の悪化が必要) |
| createPool | 0.00ms | 5ms | PASS | stable (検知には +0.5ms (baseline 比 +11342%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.07ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| parseSpec | 3560 B | 0 B | 102400 B | yes | PASS |
| createPool | 6232 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.08ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.14ms |
| total | 1.44ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.85% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +38.10% |
| p99 | 0.08ms | 0.02ms | +0.06ms | +299.68% |
| mean | 0.01ms | 0.01ms | +0.00ms | +29.04% |
| min | 0.00ms | 0.00ms | +0.00ms | +11.74% |
| max | 0.14ms | 0.10ms | +0.03ms | +33.76% |
| total | 1.44ms | 1.12ms | +0.32ms | +29.04% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -2.65% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.21% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -48.24% |
| mean | 0.00ms | 0.00ms | -0.00ms | -46.34% |
| min | 0.00ms | 0.00ms | +0.00ms | +13.28% |
| max | 0.01ms | 0.28ms | -0.27ms | -94.86% |
| total | 0.40ms | 0.75ms | -0.35ms | -46.34% |

