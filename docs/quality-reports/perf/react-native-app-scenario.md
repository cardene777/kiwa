# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2150%) 以上の悪化が必要) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.00ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +16052%) 以上の悪化が必要) |
| linking_error_handling (5 invalid url + listener cleanup) | 0.01ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.05ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 24592 B | 0 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 7296 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | -14984 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +1.99% |
| p95 | 0.02ms | 0.02ms | -0.01ms | -24.21% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -21.09% |
| mean | 0.01ms | 0.01ms | -0.00ms | -0.93% |
| min | 0.01ms | 0.01ms | +0.00ms | +30.59% |
| max | 0.02ms | 0.02ms | -0.00ms | -20.35% |
| total | 0.22ms | 0.22ms | -0.00ms | -0.93% |

### multi_platform_batch (5 iOS+Android+web env switch)

# Perf Report — multi_platform_batch (5 iOS+Android+web env switch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +51.87% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +30.17% |
| p99 | 0.01ms | 0.00ms | +0.00ms | +30.50% |
| mean | 0.00ms | 0.00ms | +0.00ms | +38.35% |
| min | 0.00ms | 0.00ms | +0.00ms | +10.03% |
| max | 0.01ms | 0.00ms | +0.00ms | +30.56% |
| total | 0.07ms | 0.05ms | +0.02ms | +38.35% |

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
| p50 | 0.01ms | 0.01ms | -0.00ms | -15.19% |
| p95 | 0.01ms | 0.03ms | -0.02ms | -61.41% |
| p99 | 0.01ms | 0.04ms | -0.02ms | -62.70% |
| mean | 0.01ms | 0.02ms | -0.00ms | -27.92% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.20% |
| max | 0.01ms | 0.04ms | -0.03ms | -62.98% |
| total | 0.24ms | 0.34ms | -0.09ms | -27.92% |

