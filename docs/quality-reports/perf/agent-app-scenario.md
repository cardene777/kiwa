# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0022ms | 0.02ms | 50ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0074ms | 0.02ms | 100ms | 0.00049ms | PASS | stable (p10 +2% (閾値未満)、 p95 +56% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0023ms | 0.0030ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.05ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6176 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -4640 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 960 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0022ms |
| p50 | 0.0031ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0061ms |
| stdev | 0.0052ms |
| min | 0.0021ms |
| max | 0.02ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0022ms | 0.0022ms | +0.000083ms | +3.84% |
| p50 | 0.0031ms | 0.0035ms | -0.00040ms | -11.25% |
| p95 | 0.02ms | 0.02ms | -0.00056ms | -3.54% |
| p99 | 0.02ms | 0.02ms | +0.00049ms | +2.52% |
| mean | 0.0061ms | 0.0062ms | -0.000083ms | -1.34% |
| min | 0.0021ms | 0.0021ms | +0.000042ms | +2.02% |
| max | 0.02ms | 0.02ms | +0.00075ms | +3.69% |
| total | 0.12ms | 0.12ms | -0.0017ms | -1.34% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0074ms |
| p50 | 0.0079ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0091ms |
| stdev | 0.0032ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0073ms | +0.00012ms | +1.67% |
| p50 | 0.0079ms | 0.0074ms | +0.00046ms | +6.19% |
| p95 | 0.02ms | 0.01ms | +0.0057ms | +56.00% |
| p99 | 0.02ms | 0.02ms | +0.00011ms | +0.57% |
| mean | 0.0091ms | 0.0083ms | +0.00081ms | +9.79% |
| min | 0.0073ms | 0.0071ms | +0.00017ms | +2.34% |
| max | 0.02ms | 0.02ms | -0.0013ms | -6.09% |
| total | 0.18ms | 0.17ms | +0.02ms | +9.79% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0023ms |
| p50 | 0.0024ms |
| p95 | 0.0030ms |
| p99 | 0.0033ms |
| mean | 0.0025ms |
| stdev | 0.00027ms |
| min | 0.0023ms |
| max | 0.0034ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0023ms | 0.0022ms | +0.00017ms | +7.67% |
| p50 | 0.0024ms | 0.0022ms | +0.00021ms | +9.44% |
| p95 | 0.0030ms | 0.0027ms | +0.00031ms | +11.35% |
| p99 | 0.0033ms | 0.0027ms | +0.00056ms | +20.48% |
| mean | 0.0025ms | 0.0023ms | +0.00024ms | +10.76% |
| min | 0.0023ms | 0.0022ms | +0.00017ms | +7.71% |
| max | 0.0034ms | 0.0027ms | +0.00063ms | +22.73% |
| total | 0.05ms | 0.05ms | +0.0049ms | +10.76% |

