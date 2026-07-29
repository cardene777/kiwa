# Perf Suite — sveltekit-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.02ms | 100ms | PASS | stable (差 0.01ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| form_action_batch (5 invokeAction with FormData) | 0.17ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +364%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| load_error_handling (5 throw + catch) | 0.05ms | 100ms | PASS | stable (差 0.03ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| load_workflow (10 invokeLoad) | 0.05ms | 200ms | PASS |
| form_action_batch (5 invokeAction with FormData) | 1.14ms | 200ms | PASS |
| load_error_handling (5 throw + catch) | 0.07ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| load_workflow (10 invokeLoad) | 19952 B | 0 B | 102400 B | yes | PASS |
| form_action_batch (5 invokeAction with FormData) | 24488 B | 15792 B | 102400 B | yes | PASS |
| load_error_handling (5 throw + catch) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### load_workflow (10 invokeLoad)

# Perf Report — load_workflow (10 invokeLoad).serial

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
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.01ms | +85.38% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +81.50% |
| p99 | 0.02ms | 0.01ms | +0.01ms | +61.37% |
| mean | 0.01ms | 0.01ms | +0.00ms | +67.16% |
| min | 0.01ms | 0.01ms | +0.00ms | +12.67% |
| max | 0.02ms | 0.01ms | +0.01ms | +58.32% |
| total | 0.24ms | 0.14ms | +0.10ms | +67.16% |

### form_action_batch (5 invokeAction with FormData)

# Perf Report — form_action_batch (5 invokeAction with FormData).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.13ms |
| p95 | 0.17ms |
| p99 | 0.22ms |
| mean | 0.13ms |
| stdev | 0.03ms |
| min | 0.10ms |
| max | 0.23ms |
| total | 2.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.13ms | 0.10ms | +0.02ms | +19.98% |
| p95 | 0.17ms | 0.14ms | +0.04ms | +25.77% |
| p99 | 0.22ms | 0.20ms | +0.01ms | +7.06% |
| mean | 0.13ms | 0.11ms | +0.02ms | +17.51% |
| min | 0.10ms | 0.09ms | +0.01ms | +14.73% |
| max | 0.23ms | 0.22ms | +0.01ms | +4.11% |
| total | 2.62ms | 2.23ms | +0.39ms | +17.51% |

### load_error_handling (5 throw + catch)

# Perf Report — load_error_handling (5 throw + catch).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.02ms |
| p95 | 0.05ms |
| p99 | 0.34ms |
| mean | 0.04ms |
| stdev | 0.09ms |
| min | 0.01ms |
| max | 0.41ms |
| total | 0.72ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.02ms | 0.02ms | +0.00ms | +4.50% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +179.92% |
| p99 | 0.34ms | 0.02ms | +0.32ms | +1939.28% |
| mean | 0.04ms | 0.02ms | +0.02ms | +133.37% |
| min | 0.01ms | 0.01ms | -0.00ms | -8.42% |
| max | 0.41ms | 0.02ms | +0.39ms | +2377.02% |
| total | 0.72ms | 0.31ms | +0.41ms | +133.37% |

