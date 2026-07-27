# Perf Suite — remix-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.08ms | 100ms | PASS | stable |
| action_batch (5 invokeAction) | 0.02ms | 100ms | PASS | stable |
| loader_error_handling (5 throw + catch) | 0.03ms | 100ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| loader_workflow (10 invokeLoader) | 0.16ms | 200ms | PASS |
| action_batch (5 invokeAction) | 0.07ms | 200ms | PASS |
| loader_error_handling (5 throw + catch) | 0.13ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| loader_workflow (10 invokeLoader) | 24104 B | -9185 B | 102400 B | yes | PASS |
| action_batch (5 invokeAction) | -18088 B | 0 B | 102400 B | yes | PASS |
| loader_error_handling (5 throw + catch) | -15168 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### loader_workflow (10 invokeLoader)

# Perf Report — loader_workflow (10 invokeLoader).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.04ms |
| p95 | 0.08ms |
| p99 | 0.17ms |
| mean | 0.05ms |
| stdev | 0.04ms |
| min | 0.03ms |
| max | 0.20ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.04ms | 0.04ms | +0.00ms | +12.58% |
| p95 | 0.08ms | 0.05ms | +0.03ms | +62.80% |
| p99 | 0.17ms | 0.07ms | +0.10ms | +144.12% |
| mean | 0.05ms | 0.04ms | +0.01ms | +27.91% |
| min | 0.03ms | 0.03ms | +0.00ms | +14.21% |
| max | 0.20ms | 0.08ms | +0.12ms | +157.58% |
| total | 1.05ms | 0.82ms | +0.23ms | +27.91% |

### action_batch (5 invokeAction)

# Perf Report — action_batch (5 invokeAction).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.02ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.01ms | +0.00ms | +36.16% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +6.35% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -43.49% |
| mean | 0.02ms | 0.01ms | +0.00ms | +18.45% |
| min | 0.01ms | 0.01ms | +0.00ms | +35.42% |
| max | 0.02ms | 0.05ms | -0.02ms | -48.67% |
| total | 0.33ms | 0.28ms | +0.05ms | +18.45% |

### loader_error_handling (5 throw + catch)

# Perf Report — loader_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.00ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.60ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.03ms | +0.00ms | +10.02% |
| p95 | 0.03ms | 0.03ms | +0.00ms | +10.70% |
| p99 | 0.04ms | 0.03ms | +0.01ms | +19.47% |
| mean | 0.03ms | 0.03ms | +0.00ms | +11.60% |
| min | 0.03ms | 0.03ms | +0.00ms | +10.08% |
| max | 0.04ms | 0.03ms | +0.01ms | +21.62% |
| total | 0.60ms | 0.54ms | +0.06ms | +11.60% |

