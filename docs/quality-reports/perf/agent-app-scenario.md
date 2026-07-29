# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0021ms | 0.01ms | 50ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0073ms | 0.0097ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0020ms | 0.0026ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6768 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -4736 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 9040 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0026ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0058ms |
| stdev | 0.0051ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000042ms | -1.94% |
| p50 | 0.0026ms | 0.0035ms | -0.00092ms | -26.04% |
| p95 | 0.01ms | 0.02ms | -0.0023ms | -14.65% |
| p99 | 0.02ms | 0.02ms | +0.00011ms | +0.55% |
| mean | 0.0058ms | 0.0062ms | -0.00045ms | -7.27% |
| min | 0.0020ms | 0.0021ms | -0.00013ms | -6.00% |
| max | 0.02ms | 0.02ms | +0.00071ms | +3.48% |
| total | 0.12ms | 0.12ms | -0.0090ms | -7.27% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0074ms |
| p95 | 0.0097ms |
| p99 | 0.01ms |
| mean | 0.0079ms |
| stdev | 0.0015ms |
| min | 0.0071ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0073ms | 0.0073ms | 0.00ms | 0.00% |
| p50 | 0.0074ms | 0.0074ms | +0.000021ms | +0.28% |
| p95 | 0.0097ms | 0.01ms | -0.00050ms | -4.90% |
| p99 | 0.01ms | 0.02ms | -0.0062ms | -32.62% |
| mean | 0.0079ms | 0.0083ms | -0.00036ms | -4.38% |
| min | 0.0071ms | 0.0071ms | -0.000042ms | -0.59% |
| max | 0.01ms | 0.02ms | -0.0076ms | -35.95% |
| total | 0.16ms | 0.17ms | -0.0072ms | -4.38% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0020ms |
| p50 | 0.0021ms |
| p95 | 0.0026ms |
| p99 | 0.0028ms |
| mean | 0.0022ms |
| stdev | 0.00024ms |
| min | 0.0020ms |
| max | 0.0029ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0020ms | 0.0022ms | -0.00013ms | -5.81% |
| p50 | 0.0021ms | 0.0022ms | -0.00012ms | -5.62% |
| p95 | 0.0026ms | 0.0027ms | -0.000074ms | -2.71% |
| p99 | 0.0028ms | 0.0027ms | +0.000085ms | +3.11% |
| mean | 0.0022ms | 0.0023ms | -0.000058ms | -2.58% |
| min | 0.0020ms | 0.0022ms | -0.00013ms | -5.77% |
| max | 0.0029ms | 0.0027ms | +0.00013ms | +4.55% |
| total | 0.04ms | 0.05ms | -0.0012ms | -2.58% |

