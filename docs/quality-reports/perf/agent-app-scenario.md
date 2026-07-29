# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0022ms | 0.02ms | 50ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0074ms | 0.02ms | 100ms | 0.00050ms | PASS | stable (p10 +3% (閾値未満)、 p95 +55% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0023ms | 0.0082ms | 30ms | 0.00050ms | PASS | stable (p10 +6% (閾値未満)、 p95 +204% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

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
| multi_thread_conversation (5 thread × 3 message) | -4704 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 8048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0027ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0062ms |
| stdev | 0.0055ms |
| min | 0.0020ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | 0.00ms | 0.00% |
| p50 | 0.0027ms | 0.0035ms | -0.00083ms | -23.67% |
| p95 | 0.02ms | 0.02ms | -0.00040ms | -2.53% |
| p99 | 0.02ms | 0.02ms | +0.00052ms | +2.69% |
| mean | 0.0062ms | 0.0062ms | -0.000064ms | -1.04% |
| min | 0.0020ms | 0.0021ms | -0.000083ms | -3.98% |
| max | 0.02ms | 0.02ms | +0.00075ms | +3.69% |
| total | 0.12ms | 0.12ms | -0.0013ms | -1.04% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0087ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0095ms |
| stdev | 0.0029ms |
| min | 0.0074ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0073ms | +0.00020ms | +2.75% |
| p50 | 0.0087ms | 0.0074ms | +0.0013ms | +17.42% |
| p95 | 0.02ms | 0.01ms | +0.0056ms | +55.30% |
| p99 | 0.02ms | 0.02ms | -0.0010ms | -5.46% |
| mean | 0.0095ms | 0.0083ms | +0.0012ms | +14.55% |
| min | 0.0074ms | 0.0071ms | +0.00025ms | +3.51% |
| max | 0.02ms | 0.02ms | -0.0027ms | -12.77% |
| total | 0.19ms | 0.17ms | +0.02ms | +14.55% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0082ms |
| p99 | 0.01ms |
| mean | 0.0033ms |
| stdev | 0.0026ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00012ms | +5.73% |
| p50 | 0.0024ms | 0.0022ms | +0.00017ms | +7.56% |
| p95 | 0.0082ms | 0.0027ms | +0.0055ms | +203.92% |
| p99 | 0.01ms | 0.0027ms | +0.0091ms | +333.25% |
| mean | 0.0033ms | 0.0023ms | +0.0010ms | +44.89% |
| min | 0.0023ms | 0.0022ms | +0.00013ms | +5.77% |
| max | 0.01ms | 0.0027ms | +0.01ms | +365.13% |
| total | 0.07ms | 0.05ms | +0.02ms | +44.89% |

