# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.02ms | 50ms | PASS | stable |
| multi_thread_conversation (5 thread × 3 message) | 0.02ms | 100ms | PASS | stable |
| tool_call_chain (10 toolCall build) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.03ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | verdict |
|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 287856 B | 0 B | 102400 B | PASS |
| multi_thread_conversation (5 thread × 3 message) | 416616 B | 0 B | 102400 B | PASS |
| tool_call_chain (10 toolCall build) | 86896 B | 0 B | 102400 B | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -10.13% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -17.57% |
| p99 | 0.02ms | 0.04ms | -0.02ms | -57.97% |
| mean | 0.01ms | 0.01ms | -0.00ms | -19.51% |
| min | 0.00ms | 0.00ms | -0.00ms | -7.12% |
| max | 0.02ms | 0.05ms | -0.03ms | -61.73% |
| total | 0.12ms | 0.16ms | -0.03ms | -19.51% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

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
| max | 0.03ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +6.74% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +33.44% |
| p99 | 0.02ms | 0.02ms | +0.01ms | +44.89% |
| mean | 0.01ms | 0.01ms | +0.00ms | +14.15% |
| min | 0.01ms | 0.01ms | +0.00ms | +2.44% |
| max | 0.03ms | 0.02ms | +0.01ms | +47.23% |
| total | 0.20ms | 0.18ms | +0.02ms | +14.15% |

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
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.02% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +1.79% |
| p99 | 0.00ms | 0.00ms | +0.00ms | +1.66% |
| mean | 0.00ms | 0.00ms | +0.00ms | +1.23% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.00ms | 0.00ms | +0.00ms | +1.63% |
| total | 0.04ms | 0.04ms | +0.00ms | +1.23% |

