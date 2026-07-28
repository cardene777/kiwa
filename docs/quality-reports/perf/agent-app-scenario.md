# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.03ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +2848%) 以上の悪化が必要) |
| multi_thread_conversation (5 thread × 3 message) | 0.02ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +4174%) 以上の悪化が必要) |
| tool_call_chain (10 toolCall build) | 0.00ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +13016%) 以上の悪化が必要) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.02ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 12616 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -20336 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 16888 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.03ms |
| p99 | 0.10ms |
| mean | 0.01ms |
| stdev | 0.03ms |
| min | 0.00ms |
| max | 0.12ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -14.93% |
| p95 | 0.03ms | 0.02ms | +0.02ms | +92.16% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +343.71% |
| mean | 0.01ms | 0.01ms | +0.01ms | +72.04% |
| min | 0.00ms | 0.00ms | -0.00ms | -10.35% |
| max | 0.12ms | 0.02ms | +0.09ms | +389.46% |
| total | 0.24ms | 0.14ms | +0.10ms | +72.04% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.03ms |
| total | 0.25ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +34.35% |
| p95 | 0.02ms | 0.01ms | +0.01ms | +77.79% |
| p99 | 0.03ms | 0.02ms | +0.01ms | +35.24% |
| mean | 0.01ms | 0.01ms | +0.00ms | +45.45% |
| min | 0.01ms | 0.01ms | +0.00ms | +19.39% |
| max | 0.03ms | 0.02ms | +0.01ms | +28.96% |
| total | 0.25ms | 0.17ms | +0.08ms | +45.45% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.00ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.00ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.44% |
| p95 | 0.00ms | 0.00ms | -0.00ms | -21.03% |
| p99 | 0.00ms | 0.01ms | -0.01ms | -69.40% |
| mean | 0.00ms | 0.00ms | -0.00ms | -13.64% |
| min | 0.00ms | 0.00ms | +0.00ms | +7.56% |
| max | 0.00ms | 0.01ms | -0.01ms | -72.84% |
| total | 0.05ms | 0.06ms | -0.01ms | -13.64% |

