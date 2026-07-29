# Perf Suite — solidjs-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| render_workflow (10 renderSolid) | 0.07ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +1415%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| signal_reactive_batch (5 signal+effect update chains) | 0.01ms | 100ms | PASS | stable (差 0.00ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| render_error_handling (5 throw + catch in component) | 0.03ms | 100ms | PASS | stable (差 0.02ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| render_workflow (10 renderSolid) | 0.10ms | 200ms | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 0.03ms | 200ms | PASS |
| render_error_handling (5 throw + catch in component) | 0.24ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| render_workflow (10 renderSolid) | 20384 B | 0 B | 102400 B | yes | PASS |
| signal_reactive_batch (5 signal+effect update chains) | 18448 B | 0 B | 102400 B | yes | PASS |
| render_error_handling (5 throw + catch in component) | 22128 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### render_workflow (10 renderSolid)

# Perf Report — render_workflow (10 renderSolid).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.07ms |
| p99 | 0.26ms |
| mean | 0.04ms |
| stdev | 0.06ms |
| min | 0.01ms |
| max | 0.30ms |
| total | 0.89ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.01ms | +0.02ms | +127.47% |
| p95 | 0.07ms | 0.04ms | +0.04ms | +107.69% |
| p99 | 0.26ms | 0.05ms | +0.21ms | +436.73% |
| mean | 0.04ms | 0.02ms | +0.03ms | +153.89% |
| min | 0.01ms | 0.01ms | -0.00ms | -2.02% |
| max | 0.30ms | 0.05ms | +0.25ms | +493.71% |
| total | 0.89ms | 0.35ms | +0.54ms | +153.89% |

### signal_reactive_batch (5 signal+effect update chains)

# Perf Report — signal_reactive_batch (5 signal+effect update chains).serial

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
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +19.48% |
| p95 | 0.01ms | 0.01ms | +0.00ms | +30.46% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +24.57% |
| mean | 0.01ms | 0.01ms | +0.00ms | +17.91% |
| min | 0.01ms | 0.01ms | -0.00ms | -1.34% |
| max | 0.01ms | 0.01ms | +0.00ms | +23.29% |
| total | 0.16ms | 0.13ms | +0.02ms | +17.91% |

### render_error_handling (5 throw + catch in component)

# Perf Report — render_error_handling (5 throw + catch in component).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.10ms |
| total | 0.34ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +5.20% |
| p95 | 0.03ms | 0.01ms | +0.02ms | +178.24% |
| p99 | 0.09ms | 0.01ms | +0.08ms | +768.90% |
| mean | 0.02ms | 0.01ms | +0.01ms | +96.89% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.55% |
| max | 0.10ms | 0.01ms | +0.09ms | +911.94% |
| total | 0.34ms | 0.17ms | +0.17ms | +96.89% |

