# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.01ms | 100ms | PASS | stable |
| form_action_batch (5 invokeAction with FormData) | 0.18ms | 100ms | PASS | stable |
| load_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.74ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 861200 B | 0 B | 102400 B | PASS |
| form_action_batch (5 invokeAction with FormData) | 2682576 B | 15792 B | 102400 B | PASS |
| load_error_handling (5 throw + catch) | 357856 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

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
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +0.00% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +22.94% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +17.80% |
| mean | 0.01ms | 0.01ms | +0.00ms | +4.93% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.69% |
| max | 0.01ms | 0.01ms | +0.00ms | +16.74% |
| total | 0.14ms | 0.14ms | +0.01ms | +4.93% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.18ms |
| p99 | 0.29ms |
| mean | 0.12ms |
| stdev | 0.05ms |
| min | 0.09ms |
| max | 0.32ms |
| total | 2.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.11ms | -0.00ms | -3.87% |
| p95 | 0.18ms | 0.21ms | -0.03ms | -14.63% |
| p99 | 0.29ms | 0.30ms | -0.01ms | -2.13% |
| mean | 0.12ms | 0.13ms | -0.01ms | -7.63% |
| min | 0.09ms | 0.10ms | -0.01ms | -11.25% |
| max | 0.32ms | 0.32ms | -0.00ms | -0.12% |
| total | 2.47ms | 2.67ms | -0.20ms | -7.63% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +4.31% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -5.09% |
| p99 | 0.03ms | 0.03ms | +0.00ms | +11.58% |
| mean | 0.02ms | 0.02ms | -0.00ms | -4.03% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.09% |
| max | 0.03ms | 0.03ms | +0.00ms | +14.95% |
| total | 0.30ms | 0.32ms | -0.01ms | -4.03% |

