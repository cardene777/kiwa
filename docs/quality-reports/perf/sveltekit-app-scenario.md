# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +5766%) 以上の悪化が必要) |
| form_action_batch (5 invokeAction with FormData) | 0.36ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +364%) 以上の悪化が必要) |
| load_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.86ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.08ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 273392 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 62208 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +16.88% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +14.57% |
| p99 | 0.03ms | 0.01ms | +0.01ms | +102.42% |
| mean | 0.01ms | 0.01ms | +0.00ms | +19.29% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.66% |
| max | 0.03ms | 0.01ms | +0.02ms | +115.75% |
| total | 0.17ms | 0.14ms | +0.03ms | +19.29% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.12ms |
| p95 | 0.36ms |
| p99 | 0.48ms |
| mean | 0.16ms |
| stdev | 0.10ms |
| min | 0.11ms |
| max | 0.51ms |
| total | 3.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.12ms | 0.10ms | +0.02ms | +18.74% |
| p95 | 0.36ms | 0.14ms | +0.23ms | +165.00% |
| p99 | 0.48ms | 0.20ms | +0.28ms | +137.12% |
| mean | 0.16ms | 0.11ms | +0.04ms | +39.97% |
| min | 0.11ms | 0.09ms | +0.02ms | +22.55% |
| max | 0.51ms | 0.22ms | +0.29ms | +132.72% |
| total | 3.12ms | 2.23ms | +0.89ms | +39.97% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.04ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +6.26% |
| p95 | 0.02ms | 0.02ms | +0.01ms | +51.88% |
| p99 | 0.03ms | 0.02ms | +0.02ms | +111.04% |
| mean | 0.02ms | 0.02ms | +0.00ms | +16.60% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.53% |
| max | 0.04ms | 0.02ms | +0.02ms | +125.76% |
| total | 0.36ms | 0.31ms | +0.05ms | +16.60% |

