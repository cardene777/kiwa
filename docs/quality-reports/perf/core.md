# Perf Suite — core

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| parseSpec | 0.01ms | 5ms | PASS | stable |
| createPool | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| parseSpec | 0.06ms | 10ms | PASS |
| createPool | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| parseSpec | -6434616 B | -24464 B | 102400 B | PASS |
| createPool | 1091888 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### parseSpec

# Perf Report — parseSpec.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.90ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -1.01% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.26% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +19.17% |
| mean | 0.00ms | 0.00ms | -0.00ms | -0.39% |
| min | 0.00ms | 0.00ms | -0.00ms | -2.34% |
| max | 0.02ms | 0.01ms | +0.00ms | +11.71% |
| total | 0.90ms | 0.91ms | -0.00ms | -0.39% |

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
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +3.48% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -6.43% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +31.35% |
| mean | 0.00ms | 0.00ms | +0.00ms | +2.37% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.01ms | -0.00ms | -6.03% |
| total | 0.30ms | 0.29ms | +0.01ms | +2.37% |

