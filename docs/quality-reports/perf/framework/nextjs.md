# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerAction | 0.00ms | 5ms | PASS | stable |
| invokeMiddleware | 0.01ms | 5ms | PASS | stable |
| renderServerComponent | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | 1040 B | 0 B | 102400 B | yes | PASS |
| invokeMiddleware | -11288 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -14784 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

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
| max | 0.03ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +35.31% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +40.84% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +10.16% |
| mean | 0.00ms | 0.00ms | +0.00ms | +27.30% |
| min | 0.00ms | 0.00ms | +0.00ms | +15.53% |
| max | 0.03ms | 0.02ms | +0.01ms | +25.84% |
| total | 0.27ms | 0.21ms | +0.06ms | +27.30% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.00ms | +0.00ms | +11.41% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +19.11% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -56.03% |
| mean | 0.01ms | 0.01ms | -0.00ms | -1.96% |
| min | 0.01ms | 0.00ms | +0.00ms | +11.94% |
| max | 0.03ms | 0.08ms | -0.05ms | -67.91% |
| total | 1.18ms | 1.20ms | -0.02ms | -1.96% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -7.41% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +33.59% |
| mean | 0.00ms | 0.00ms | +0.00ms | +18.33% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.01ms | +0.01ms | +108.07% |
| total | 0.14ms | 0.12ms | +0.02ms | +18.33% |

