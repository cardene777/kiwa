# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 50ms | PASS | stable |
| multi_thread_conversation (5 thread × 3 message) | 0.01ms | 100ms | PASS | stable |
| tool_call_chain (10 toolCall build) | 0.00ms | 30ms | PASS | stable |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -3248 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -19624 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 15256 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +2.03% |
| p95 | 0.01ms | 0.01ms | -0.00ms | -3.77% |
| p99 | 0.02ms | 0.02ms | -0.00ms | -0.92% |
| mean | 0.01ms | 0.01ms | +0.00ms | +0.33% |
| min | 0.00ms | 0.00ms | +0.00ms | +1.90% |
| max | 0.02ms | 0.02ms | -0.00ms | -0.41% |
| total | 0.12ms | 0.12ms | +0.00ms | +0.33% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | -0.00ms | -1.15% |
| p95 | 0.01ms | 0.02ms | -0.01ms | -32.81% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -35.83% |
| mean | 0.01ms | 0.01ms | -0.00ms | -5.62% |
| min | 0.01ms | 0.01ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.03ms | -0.01ms | -36.42% |
| total | 0.17ms | 0.18ms | -0.01ms | -5.62% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.00ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -3.69% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +20.03% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +249.64% |
| mean | 0.00ms | 0.00ms | +0.00ms | +14.73% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.94% |
| max | 0.01ms | 0.00ms | +0.01ms | +306.20% |
| total | 0.05ms | 0.05ms | +0.01ms | +14.73% |

