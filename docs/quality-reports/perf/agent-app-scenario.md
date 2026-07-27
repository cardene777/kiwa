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
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -72 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -19624 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 13008 B | 0 B | 102400 B | yes | PASS |

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
| stdev | 0.01ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | -0.00ms | -7.31% |
| p95 | 0.02ms | 0.01ms | +0.00ms | +13.36% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +18.84% |
| mean | 0.01ms | 0.01ms | +0.00ms | +7.20% |
| min | 0.00ms | 0.00ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.00ms | +19.83% |
| total | 0.13ms | 0.12ms | +0.01ms | +7.20% |

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
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +15.42% |
| p95 | 0.02ms | 0.02ms | -0.00ms | -23.62% |
| p99 | 0.02ms | 0.02ms | -0.01ms | -35.00% |
| mean | 0.01ms | 0.01ms | +0.00ms | +3.89% |
| min | 0.01ms | 0.01ms | +0.00ms | +14.92% |
| max | 0.02ms | 0.03ms | -0.01ms | -37.24% |
| total | 0.19ms | 0.18ms | +0.01ms | +3.89% |

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
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +9.24% |
| p95 | 0.00ms | 0.00ms | +0.00ms | +32.58% |
| p99 | 0.01ms | 0.00ms | +0.01ms | +263.24% |
| mean | 0.00ms | 0.00ms | +0.00ms | +26.05% |
| min | 0.00ms | 0.00ms | +0.00ms | +9.60% |
| max | 0.01ms | 0.00ms | +0.01ms | +320.05% |
| total | 0.06ms | 0.05ms | +0.01ms | +26.05% |

