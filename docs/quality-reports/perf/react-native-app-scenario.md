# Perf Suite — react-native-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.06ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +16052%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| linking_error_handling (5 invalid url + listener cleanup) | 1.27ms | 100ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 0.09ms | 200ms | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 0.02ms | 200ms | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | 10.52ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 setup + navigate + storage) | 19128 B | -11199 B | 102400 B | yes | PASS |
| multi_platform_batch (5 iOS+Android+web env switch) | 7264 B | 0 B | 102400 B | yes | PASS |
| linking_error_handling (5 invalid url + listener cleanup) | -16064 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 setup + navigate + storage)

# Perf Report — user_flow_workflow (10 setup + navigate + storage).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.06ms |
| p99 | 0.08ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.08ms |
| total | 0.65ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.01ms | +0.02ms | +203.32% |
| p95 | 0.06ms | 0.02ms | +0.03ms | +141.13% |
| p99 | 0.08ms | 0.02ms | +0.05ms | +218.04% |
| mean | 0.03ms | 0.01ms | +0.02ms | +195.50% |
| min | 0.02ms | 0.01ms | +0.02ms | +214.13% |
| max | 0.08ms | 0.02ms | +0.06ms | +236.55% |
| total | 0.65ms | 0.22ms | +0.43ms | +195.50% |

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
| p50 | 0.00ms | 0.00ms | +0.00ms | +53.85% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +88.74% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +130.70% |
| mean | 0.00ms | 0.00ms | +0.00ms | +56.07% |
| min | 0.00ms | 0.00ms | +0.00ms | +12.00% |
| max | 0.01ms | 0.00ms | +0.01ms | +137.96% |
| total | 0.07ms | 0.05ms | +0.03ms | +56.07% |

### linking_error_handling (5 invalid url + listener cleanup)

# Perf Report — linking_error_handling (5 invalid url + listener cleanup).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 1.27ms |
| p99 | 2.62ms |
| mean | 0.25ms |
| stdev | 0.69ms |
| min | 0.02ms |
| max | 2.96ms |
| total | 5.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.01ms | +0.02ms | +160.76% |
| p95 | 1.27ms | 0.03ms | +1.24ms | +3589.23% |
| p99 | 2.62ms | 0.04ms | +2.58ms | +6649.72% |
| mean | 0.25ms | 0.02ms | +0.24ms | +1394.37% |
| min | 0.02ms | 0.01ms | +0.00ms | +31.42% |
| max | 2.96ms | 0.04ms | +2.92ms | +7311.01% |
| total | 5.07ms | 0.34ms | +4.73ms | +1394.37% |

