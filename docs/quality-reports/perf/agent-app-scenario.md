# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0029ms | 0.02ms | 50ms | 0.00083ms | PASS | stable (差 0.00069ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0072ms | 0.01ms | 100ms | 0.00083ms | PASS | stable (p10 -1% (閾値未満)、 p95 +29% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0021ms | 0.0035ms | 30ms | 0.00083ms | PASS | stable (p10 -2% (閾値未満)、 p95 +27% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.02ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6096 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -4608 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 8944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0029ms |
| p50 | 0.0056ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.0090ms |
| stdev | 0.0070ms |
| min | 0.0025ms |
| max | 0.03ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0022ms | +0.00069ms | +31.77% |
| p50 | 0.0056ms | 0.0035ms | +0.0021ms | +59.16% |
| p95 | 0.02ms | 0.02ms | +0.0050ms | +31.61% |
| p99 | 0.03ms | 0.02ms | +0.0076ms | +38.95% |
| mean | 0.0090ms | 0.0062ms | +0.0028ms | +44.64% |
| min | 0.0025ms | 0.0021ms | +0.00046ms | +22.04% |
| max | 0.03ms | 0.02ms | +0.0082ms | +40.37% |
| total | 0.18ms | 0.12ms | +0.06ms | +44.64% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0073ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0083ms |
| stdev | 0.0021ms |
| min | 0.0071ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0073ms | -0.000087ms | -1.20% |
| p50 | 0.0073ms | 0.0074ms | -0.000083ms | -1.13% |
| p95 | 0.01ms | 0.01ms | +0.0030ms | +29.11% |
| p99 | 0.01ms | 0.02ms | -0.0051ms | -26.69% |
| mean | 0.0083ms | 0.0083ms | -0.000010ms | -0.12% |
| min | 0.0071ms | 0.0071ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.02ms | -0.0071ms | -33.40% |
| total | 0.17ms | 0.17ms | -0.00021ms | -0.12% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0021ms |
| p50 | 0.0022ms |
| p95 | 0.0035ms |
| p99 | 0.0090ms |
| mean | 0.0027ms |
| stdev | 0.0018ms |
| min | 0.0021ms |
| max | 0.01ms |
| total | 0.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0022ms | -0.000042ms | -1.93% |
| p50 | 0.0022ms | 0.0022ms | -0.000041ms | -1.86% |
| p95 | 0.0035ms | 0.0027ms | +0.00074ms | +27.28% |
| p99 | 0.0090ms | 0.0027ms | +0.0063ms | +229.04% |
| mean | 0.0027ms | 0.0023ms | +0.00041ms | +18.21% |
| min | 0.0021ms | 0.0022ms | -0.000041ms | -1.89% |
| max | 0.01ms | 0.0027ms | +0.0077ms | +278.76% |
| total | 0.05ms | 0.05ms | +0.0083ms | +18.21% |

