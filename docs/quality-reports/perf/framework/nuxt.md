# Perf Suite — nuxt

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeEventHandler | 0.00ms | 5ms | PASS | stable |
| invokeRouteMiddleware | 0.01ms | 5ms | PASS | regressed |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeEventHandler | 0.04ms | 10ms | PASS |
| invokeRouteMiddleware | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeEventHandler | 820960 B | 0 B | 102400 B | PASS |
| invokeRouteMiddleware | 579656 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### invokeEventHandler

# Perf Report — invokeEventHandler.serial

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
| max | 0.02ms |
| total | 0.40ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +58.30% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +17.58% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +49.44% |
| mean | 0.00ms | 0.00ms | +0.00ms | +37.82% |
| min | 0.00ms | 0.00ms | +0.00ms | +17.43% |
| max | 0.02ms | 0.02ms | +0.00ms | +13.84% |
| total | 0.40ms | 0.29ms | +0.11ms | +37.82% |

### invokeRouteMiddleware

# Perf Report — invokeRouteMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.05ms |
| total | 0.48ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +149.83% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +197.76% |
| p99 | 0.02ms | 0.00ms | +0.01ms | +384.95% |
| mean | 0.00ms | 0.00ms | +0.00ms | +172.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +33.20% |
| max | 0.05ms | 0.01ms | +0.04ms | +711.87% |
| total | 0.48ms | 0.18ms | +0.30ms | +172.64% |

