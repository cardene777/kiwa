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
| linking_error_handling (5 invalid url + listener cleanup) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | -8192 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 88 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 6280 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.62% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +5.48% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -14.11% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.05% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.77% |
| max | 0.02ms | 0.02ms | -0.00ms | -17.65% |
| total | 0.19ms | 0.20ms | -0.01ms | -5.05% |

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
| max | 0.02ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +76.29% |
| p95 | 0.01ms | 0.00ms | +0.01ms | +159.89% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +229.30% |
| mean | 0.00ms | 0.00ms | +0.00ms | +90.74% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.29% |
| max | 0.02ms | 0.00ms | +0.01ms | +242.95% |
| total | 0.10ms | 0.05ms | +0.05ms | +90.74% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.95% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -21.05% |
| p99 | 0.01ms | 0.02ms | -0.01ms | -34.36% |
| mean | 0.01ms | 0.01ms | -0.00ms | -14.50% |
| min | 0.01ms | 0.01ms | -0.00ms | -9.27% |
| max | 0.01ms | 0.02ms | -0.01ms | -36.93% |
| total | 0.24ms | 0.28ms | -0.04ms | -14.50% |

