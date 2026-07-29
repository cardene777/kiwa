# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00057ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0050ms | 0.06ms | 50ms | 0.00057ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0087ms | 0.01ms | 100ms | 0.00057ms | PASS | regressed — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0023ms | 0.0045ms | 30ms | 0.00057ms | PASS | stable (p10 +8% (閾値未満)、 p95 +66% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.03ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 2096 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | 8408 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | -1680 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0050ms |
| p50 | 0.0066ms |
| p95 | 0.06ms |
| p99 | 0.18ms |
| mean | 0.03ms |
| stdev | 0.05ms |
| min | 0.0049ms |
| max | 0.21ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0050ms | 0.0022ms | +0.0029ms | +132.31% |
| p50 | 0.0066ms | 0.0035ms | +0.0031ms | +88.75% |
| p95 | 0.06ms | 0.02ms | +0.04ms | +271.15% |
| p99 | 0.18ms | 0.02ms | +0.16ms | +812.68% |
| mean | 0.03ms | 0.0062ms | +0.02ms | +305.70% |
| min | 0.0049ms | 0.0021ms | +0.0028ms | +134.04% |
| max | 0.21ms | 0.02ms | +0.19ms | +917.23% |
| total | 0.50ms | 0.12ms | +0.38ms | +305.70% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0087ms |
| p50 | 0.0093ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0097ms |
| stdev | 0.0015ms |
| min | 0.0085ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0087ms | 0.0073ms | +0.0015ms | +20.05% |
| p50 | 0.0093ms | 0.0074ms | +0.0019ms | +25.85% |
| p95 | 0.01ms | 0.01ms | +0.0011ms | +11.04% |
| p99 | 0.01ms | 0.02ms | -0.0045ms | -23.89% |
| mean | 0.0097ms | 0.0083ms | +0.0015ms | +17.88% |
| min | 0.0085ms | 0.0071ms | +0.0014ms | +19.89% |
| max | 0.02ms | 0.02ms | -0.0060ms | -28.10% |
| total | 0.19ms | 0.17ms | +0.03ms | +17.88% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0045ms |
| p99 | 0.0052ms |
| mean | 0.0028ms |
| stdev | 0.00085ms |
| min | 0.0023ms |
| max | 0.0054ms |
| total | 0.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00017ms | +7.71% |
| p50 | 0.0024ms | 0.0022ms | +0.00019ms | +8.51% |
| p95 | 0.0045ms | 0.0027ms | +0.0018ms | +66.24% |
| p99 | 0.0052ms | 0.0027ms | +0.0025ms | +90.87% |
| mean | 0.0028ms | 0.0023ms | +0.00058ms | +25.39% |
| min | 0.0023ms | 0.0022ms | +0.00013ms | +5.82% |
| max | 0.0054ms | 0.0027ms | +0.0027ms | +96.95% |
| total | 0.06ms | 0.05ms | +0.01ms | +25.39% |

