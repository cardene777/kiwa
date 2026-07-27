# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.02ms | 100ms | PASS | stable |
| form_action_batch (5 invokeAction with FormData) | 0.26ms | 100ms | PASS | stable |
| load_error_handling (5 throw + catch) | 0.02ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 1.15ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 2.10ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 4328 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 25328 B | 0 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | -736 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.01ms | +160.15% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +118.60% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +42.68% |
| mean | 0.02ms | 0.01ms | +0.01ms | +142.55% |
| min | 0.02ms | 0.01ms | +0.01ms | +167.87% |
| max | 0.02ms | 0.01ms | +0.00ms | +31.48% |
| total | 0.33ms | 0.14ms | +0.19ms | +142.55% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.26ms |
| p99 | 0.26ms |
| mean | 0.15ms |
| stdev | 0.06ms |
| min | 0.11ms |
| max | 0.27ms |
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.10ms | +0.03ms | +29.16% |
| p95 | 0.26ms | 0.13ms | +0.14ms | +108.29% |
| p99 | 0.26ms | 0.19ms | +0.08ms | +40.57% |
| mean | 0.15ms | 0.11ms | +0.05ms | +44.33% |
| min | 0.11ms | 0.09ms | +0.03ms | +30.03% |
| max | 0.27ms | 0.20ms | +0.06ms | +30.07% |
| total | 3.06ms | 2.12ms | +0.94ms | +44.33% |

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
| stdev | 0.00ms |
| min | 0.02ms |
| max | 0.04ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +3.08% |
| p95 | 0.02ms | 0.06ms | -0.04ms | -68.05% |
| p99 | 0.03ms | 0.17ms | -0.14ms | -81.04% |
| mean | 0.02ms | 0.03ms | -0.01ms | -37.95% |
| min | 0.02ms | 0.01ms | +0.00ms | +8.35% |
| max | 0.04ms | 0.20ms | -0.16ms | -81.98% |
| total | 0.35ms | 0.56ms | -0.21ms | -37.95% |

