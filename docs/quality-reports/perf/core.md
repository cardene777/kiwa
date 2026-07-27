# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.01ms | 5ms | PASS | regressed |
| createPool | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.06ms | 10ms | PASS |
| createPool | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| parseSpec | -6404152 B | -8 B | 102400 B | PASS |
| createPool | 1091936 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.03ms |
| total | 1.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +1.01% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +35.39% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +51.40% |
| mean | 0.01ms | 0.00ms | +0.00ms | +13.96% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.16% |
| max | 0.03ms | 0.01ms | +0.02ms | +112.58% |
| total | 1.04ms | 0.91ms | +0.13ms | +13.96% |

### createPool

# Perf Report — createPool.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +41.39% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +58.83% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +115.46% |
| mean | 0.00ms | 0.00ms | +0.00ms | +54.58% |
| min | 0.00ms | 0.00ms | +0.00ms | +38.50% |
| max | 0.02ms | 0.01ms | +0.01ms | +105.32% |
| total | 0.46ms | 0.29ms | +0.16ms | +54.58% |

