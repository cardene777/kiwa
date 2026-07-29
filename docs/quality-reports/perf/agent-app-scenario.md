# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0052ms | 0.04ms | 50ms | 0.0012ms | PASS | regressed — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0082ms | 0.02ms | 100ms | 0.0012ms | PASS | stable (p10 +13% (閾値未満)、 p95 +77% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0024ms | 0.0028ms | 30ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.05ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -5520 B | -9529 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | 2912 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 269472 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0052ms |
| p50 | 0.0085ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0051ms |
| max | 0.04ms |
| total | 0.29ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0052ms | 0.0022ms | +0.0030ms | +140.80% |
| p50 | 0.0085ms | 0.0035ms | +0.0050ms | +141.39% |
| p95 | 0.04ms | 0.02ms | +0.02ms | +148.46% |
| p99 | 0.04ms | 0.02ms | +0.02ms | +121.59% |
| mean | 0.01ms | 0.0062ms | +0.0081ms | +130.26% |
| min | 0.0051ms | 0.0021ms | +0.0030ms | +146.04% |
| max | 0.04ms | 0.02ms | +0.02ms | +116.40% |
| total | 0.29ms | 0.12ms | +0.16ms | +130.26% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0090ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0033ms |
| min | 0.0080ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0073ms | +0.00095ms | +13.05% |
| p50 | 0.0090ms | 0.0074ms | +0.0016ms | +21.63% |
| p95 | 0.02ms | 0.01ms | +0.0078ms | +76.89% |
| p99 | 0.02ms | 0.02ms | -0.00020ms | -1.04% |
| mean | 0.01ms | 0.0083ms | +0.0022ms | +26.74% |
| min | 0.0080ms | 0.0071ms | +0.00092ms | +12.87% |
| max | 0.02ms | 0.02ms | -0.0022ms | -10.42% |
| total | 0.21ms | 0.17ms | +0.04ms | +26.74% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0024ms |
| p50 | 0.0024ms |
| p95 | 0.0028ms |
| p99 | 0.0029ms |
| mean | 0.0025ms |
| stdev | 0.00016ms |
| min | 0.0023ms |
| max | 0.0029ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0024ms | 0.0022ms | +0.00021ms | +9.60% |
| p50 | 0.0024ms | 0.0022ms | +0.00021ms | +9.47% |
| p95 | 0.0028ms | 0.0027ms | +0.00012ms | +4.58% |
| p99 | 0.0029ms | 0.0027ms | +0.00012ms | +4.55% |
| mean | 0.0025ms | 0.0023ms | +0.00021ms | +9.38% |
| min | 0.0023ms | 0.0022ms | +0.00017ms | +7.71% |
| max | 0.0029ms | 0.0027ms | +0.00013ms | +4.55% |
| total | 0.05ms | 0.05ms | +0.0042ms | +9.38% |

