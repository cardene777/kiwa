# Perf Suite — solidstart

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| invokeServerFunction | 0.00ms | 5ms | PASS | stable |
| invokeApiRoute | 0.03ms | 5ms | PASS | stable |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerFunction | 0.01ms | 10ms | PASS |
| invokeApiRoute | 0.15ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| invokeServerFunction | 320920 B | 0 B | 102400 B | PASS |
| invokeApiRoute | -5599680 B | -4026 B | 102400 B | PASS |

## Detailed serial reports

### invokeServerFunction

# Perf Report — invokeServerFunction.serial

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.20% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -2.72% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -0.57% |
| mean | 0.00ms | 0.00ms | -0.00ms | -9.82% |
| min | 0.00ms | 0.00ms | -0.00ms | -18.12% |
| max | 0.01ms | 0.01ms | +0.00ms | +1.36% |
| total | 0.15ms | 0.16ms | -0.02ms | -9.82% |

### invokeApiRoute

# Perf Report — invokeApiRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.11ms |
| total | 3.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -2.95% |
| p95 | 0.03ms | 0.03ms | -0.01ms | -15.20% |
| p99 | 0.06ms | 0.08ms | -0.02ms | -23.54% |
| mean | 0.02ms | 0.02ms | -0.00ms | -3.71% |
| min | 0.01ms | 0.01ms | +0.00ms | +10.04% |
| max | 0.11ms | 0.16ms | -0.05ms | -31.66% |
| total | 3.21ms | 3.34ms | -0.12ms | -3.71% |

