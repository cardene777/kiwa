# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.01ms | 100ms | PASS | stable |
| form_action_batch (5 invokeAction with FormData) | 0.19ms | 100ms | PASS | stable |
| load_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.04ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 0.83ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.06ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 3592 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 20016 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 912 B | 0 B | 102400 B | yes | PASS |

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
| p50 | 0.01ms | 0.01ms | +0.00ms | +2.70% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -2.27% |
| p99 | 0.01ms | 0.01ms | -0.00ms | -9.19% |
| mean | 0.01ms | 0.01ms | +0.00ms | +1.35% |
| min | 0.01ms | 0.01ms | +0.00ms | +3.57% |
| max | 0.01ms | 0.01ms | -0.00ms | -10.21% |
| total | 0.14ms | 0.14ms | +0.00ms | +1.35% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.11ms |
| p95 | 0.19ms |
| p99 | 0.32ms |
| mean | 0.13ms |
| stdev | 0.06ms |
| min | 0.10ms |
| max | 0.35ms |
| total | 2.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.11ms | 0.10ms | +0.01ms | +11.46% |
| p95 | 0.19ms | 0.13ms | +0.07ms | +52.03% |
| p99 | 0.32ms | 0.19ms | +0.13ms | +69.15% |
| mean | 0.13ms | 0.11ms | +0.03ms | +27.05% |
| min | 0.10ms | 0.09ms | +0.01ms | +15.18% |
| max | 0.35ms | 0.20ms | +0.15ms | +71.81% |
| total | 2.70ms | 2.12ms | +0.57ms | +27.05% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

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
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.02ms | -0.00ms | -5.09% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -67.93% |
| p99 | 0.02ms | 0.17ms | -0.15ms | -86.60% |
| mean | 0.01ms | 0.03ms | -0.01ms | -46.67% |
| min | 0.01ms | 0.01ms | -0.00ms | -14.99% |
| max | 0.02ms | 0.20ms | -0.18ms | -87.94% |
| total | 0.30ms | 0.56ms | -0.26ms | -46.67% |

