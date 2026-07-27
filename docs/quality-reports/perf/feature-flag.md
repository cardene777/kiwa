# Perf Suite — feature-flag

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| evaluateFlag | 0.00ms | 5ms | PASS | stable |
| evaluateAllFlags | 0.00ms | 5ms | PASS | stable |
| registerRule | 0.00ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| evaluateFlag | 0.01ms | 10ms | PASS |
| evaluateAllFlags | 0.02ms | 10ms | PASS |
| registerRule | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| evaluateFlag | 23912 B | 0 B | 102400 B | yes | PASS |
| evaluateAllFlags | 87232 B | 0 B | 102400 B | yes | PASS |
| registerRule | 3328 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### evaluateFlag

# Perf Report — evaluateFlag.serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +9.05% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +16.22% |
| mean | 0.00ms | 0.00ms | +0.00ms | +8.28% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.93% |
| max | 0.01ms | 0.01ms | +0.00ms | +6.18% |
| total | 0.16ms | 0.14ms | +0.01ms | +8.28% |

### evaluateAllFlags

# Perf Report — evaluateAllFlags.serial

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
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +13.15% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +10.07% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +55.20% |
| mean | 0.00ms | 0.00ms | +0.00ms | +19.69% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.17% |
| max | 0.01ms | 0.00ms | +0.01ms | +251.12% |
| total | 0.24ms | 0.20ms | +0.04ms | +19.69% |

### registerRule

# Perf Report — registerRule.serial

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
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.48% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +70.75% |
| p99 | 0.00ms | 0.00ms | -0.00ms | -13.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +5.87% |
| min | 0.00ms | 0.00ms | +0.00ms | +32.80% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.63% |
| total | 0.06ms | 0.06ms | +0.00ms | +5.87% |

