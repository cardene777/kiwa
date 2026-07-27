# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.02ms | 100ms | PASS | stable |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 100ms | PASS | stable |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.04ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.02ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | -4496 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 1336 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 7200 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.84% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +5.09% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -12.67% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.76% |
| min | 0.01ms | 0.01ms | -0.00ms | -5.00% |
| max | 0.02ms | 0.02ms | -0.00ms | -15.88% |
| total | 0.19ms | 0.20ms | -0.01ms | -4.76% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.03% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +51.33% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +119.31% |
| mean | 0.00ms | 0.00ms | +0.00ms | +9.91% |
| min | 0.00ms | 0.00ms | -0.00ms | -5.56% |
| max | 0.01ms | 0.00ms | +0.01ms | +132.68% |
| total | 0.06ms | 0.05ms | +0.01ms | +9.91% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -11.58% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -21.76% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -30.96% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.86% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.61% |
| max | 0.01ms | 0.02ms | -0.01ms | -32.73% |
| total | 0.24ms | 0.28ms | -0.04ms | -14.86% |

