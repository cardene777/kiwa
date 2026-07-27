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
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 952256 B | 0 B | 102400 B | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 243760 B | 0 B | 102400 B | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 372536 B | 0 B | 102400 B | PASS |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -0.25% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +5.54% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +7.95% |
| mean | 0.01ms | 0.01ms | -0.00ms | -2.31% |
| min | 0.01ms | 0.01ms | -0.00ms | -11.63% |
| max | 0.02ms | 0.02ms | +0.00ms | +8.46% |
| total | 0.19ms | 0.19ms | -0.00ms | -2.31% |

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
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +43.72% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +130.72% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +129.15% |
| mean | 0.00ms | 0.00ms | +0.00ms | +61.62% |
| min | 0.00ms | 0.00ms | +0.00ms | +18.58% |
| max | 0.01ms | 0.01ms | +0.01ms | +128.89% |
| total | 0.08ms | 0.05ms | +0.03ms | +61.62% |

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
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -9.70% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +0.75% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +64.62% |
| mean | 0.01ms | 0.01ms | -0.00ms | -4.39% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.00% |
| max | 0.03ms | 0.01ms | +0.01ms | +80.46% |
| total | 0.25ms | 0.27ms | -0.01ms | -4.39% |

