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
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | -4496 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 1272 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 6736 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -3.62% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +10.27% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -5.24% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.48% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.79% |
| max | 0.02ms | 0.02ms | -0.00ms | -8.04% |
| total | 0.20ms | 0.20ms | -0.01ms | -2.48% |

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
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +27.20% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +84.75% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +134.17% |
| mean | 0.00ms | 0.00ms | +0.00ms | +45.87% |
| min | 0.00ms | 0.00ms | -0.00ms | -3.69% |
| max | 0.01ms | 0.00ms | +0.01ms | +143.89% |
| total | 0.07ms | 0.05ms | +0.02ms | +45.87% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -10.63% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -15.97% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +6.78% |
| mean | 0.01ms | 0.01ms | -0.00ms | -10.46% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.94% |
| max | 0.02ms | 0.02ms | +0.00ms | +11.18% |
| total | 0.25ms | 0.28ms | -0.03ms | -10.46% |

