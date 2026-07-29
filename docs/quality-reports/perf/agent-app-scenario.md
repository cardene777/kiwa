# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00033ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00067ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0023ms | 0.02ms | 50ms | 0.00067ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0072ms | 0.01ms | 100ms | 0.00067ms | PASS | stable (p10 -1% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0022ms | 0.0034ms | 30ms | 0.00067ms | PASS | stable (p10 -0% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.05ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6144 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -6080 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 7952 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0035ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0068ms |
| stdev | 0.0058ms |
| min | 0.0022ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00017ms | +7.68% |
| p50 | 0.0035ms | 0.0035ms | -0.000021ms | -0.60% |
| p95 | 0.02ms | 0.02ms | -0.000031ms | -0.19% |
| p99 | 0.02ms | 0.02ms | +0.00013ms | +0.66% |
| mean | 0.0068ms | 0.0062ms | +0.00057ms | +9.15% |
| min | 0.0022ms | 0.0021ms | +0.000083ms | +3.98% |
| max | 0.02ms | 0.02ms | +0.00017ms | +0.82% |
| total | 0.14ms | 0.12ms | +0.01ms | +9.15% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0075ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0089ms |
| stdev | 0.0035ms |
| min | 0.0070ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0073ms | -0.000091ms | -1.26% |
| p50 | 0.0075ms | 0.0074ms | +0.000042ms | +0.56% |
| p95 | 0.01ms | 0.01ms | +0.0048ms | +46.75% |
| p99 | 0.02ms | 0.02ms | +0.0013ms | +6.77% |
| mean | 0.0089ms | 0.0083ms | +0.00062ms | +7.47% |
| min | 0.0070ms | 0.0071ms | -0.00017ms | -2.34% |
| max | 0.02ms | 0.02ms | +0.00042ms | +1.96% |
| total | 0.18ms | 0.17ms | +0.01ms | +7.47% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0022ms |
| p95 | 0.0034ms |
| p99 | 0.0092ms |
| mean | 0.0028ms |
| stdev | 0.0019ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | -0.0000050ms | -0.23% |
| p50 | 0.0022ms | 0.0022ms | +0.000042ms | +1.90% |
| p95 | 0.0034ms | 0.0027ms | +0.00067ms | +24.72% |
| p99 | 0.0092ms | 0.0027ms | +0.0064ms | +234.63% |
| mean | 0.0028ms | 0.0023ms | +0.00049ms | +21.62% |
| min | 0.0021ms | 0.0022ms | -0.000041ms | -1.89% |
| max | 0.01ms | 0.0027ms | +0.0079ms | +286.36% |
| total | 0.06ms | 0.05ms | +0.0098ms | +21.62% |

