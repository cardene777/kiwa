# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.02ms | 50ms | PASS | stable (検知には +0.5ms (baseline 比 +2848%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.06ms | 100ms | PASS | stable (差 0.04ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.01ms | 30ms | PASS | stable (検知には +0.5ms (baseline 比 +13016%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.03ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.17ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 656 B | -9432 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -20240 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 9040 B | 0 B | 102400 B | yes | PASS |

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
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +0.59% |
| p95 | 0.02ms | 0.02ms | +0.00ms | +16.37% |
| p99 | 0.02ms | 0.02ms | +0.00ms | +4.13% |
| mean | 0.01ms | 0.01ms | +0.00ms | +2.75% |
| min | 0.00ms | 0.00ms | -0.00ms | -1.70% |
| max | 0.02ms | 0.02ms | +0.00ms | +1.90% |
| total | 0.15ms | 0.14ms | +0.00ms | +2.75% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.06ms |
| total | 0.36ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +47.10% |
| p95 | 0.06ms | 0.01ms | +0.04ms | +373.13% |
| p99 | 0.06ms | 0.02ms | +0.04ms | +215.48% |
| mean | 0.02ms | 0.01ms | +0.01ms | +111.11% |
| min | 0.01ms | 0.01ms | +0.00ms | +31.52% |
| max | 0.06ms | 0.02ms | +0.04ms | +192.21% |
| total | 0.36ms | 0.17ms | +0.19ms | +111.11% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.00ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.00ms |
| stdev | 0.00ms |
| min | 0.00ms |
| max | 0.02ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.00ms | 0.00ms | +0.00ms | +4.42% |
| p95 | 0.01ms | 0.00ms | +0.00ms | +48.80% |
| p99 | 0.01ms | 0.01ms | +0.00ms | +21.68% |
| mean | 0.00ms | 0.00ms | +0.00ms | +17.06% |
| min | 0.00ms | 0.00ms | +0.00ms | +5.71% |
| max | 0.02ms | 0.01ms | +0.00ms | +19.75% |
| total | 0.07ms | 0.06ms | +0.01ms | +17.06% |

