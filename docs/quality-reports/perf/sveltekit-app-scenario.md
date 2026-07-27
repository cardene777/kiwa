# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.01ms | 100ms | PASS | stable |
| form_action_batch (5 invokeAction with FormData) | 0.49ms | 100ms | PASS | stable |
| load_error_handling (5 throw + catch) | 0.04ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.11ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.88ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 15912 B | -9857 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 30512 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | -656 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.37% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -0.37% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -8.69% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.42% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.14% |
| max | 0.01ms | 0.01ms | -0.00ms | -9.91% |
| total | 0.14ms | 0.14ms | +0.00ms | +2.42% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.49ms |
| p99 | 0.51ms |
| mean | 0.20ms |
| stdev | 0.13ms |
| min | 0.10ms |
| max | 0.51ms |
| total | 4.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.10ms | +0.03ms | +31.05% |
| p95 | 0.49ms | 0.13ms | +0.37ms | +291.41% |
| p99 | 0.51ms | 0.19ms | +0.32ms | +168.97% |
| mean | 0.20ms | 0.11ms | +0.09ms | +88.93% |
| min | 0.10ms | 0.09ms | +0.02ms | +18.74% |
| max | 0.51ms | 0.20ms | +0.31ms | +149.99% |
| total | 4.01ms | 2.12ms | +1.89ms | +88.93% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +9.64% |
| p95 | 0.04ms | 0.06ms | -0.02ms | -38.89% |
| p99 | 0.04ms | 0.17ms | -0.13ms | -77.95% |
| mean | 0.02ms | 0.03ms | -0.01ms | -30.48% |
| min | 0.02ms | 0.01ms | +0.00ms | +14.12% |
| max | 0.04ms | 0.20ms | -0.16ms | -80.75% |
| total | 0.39ms | 0.56ms | -0.17ms | -30.48% |

