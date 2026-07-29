# Perf Suite — agent-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.0019ms | 0.02ms | 50ms | 0.00050ms | PASS | stable (p10 +8% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_thread_conversation (5 thread × 3 message) | 0.0077ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| tool_call_chain (10 toolCall build) | 0.0016ms | 0.0018ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | cpu | 0.08ms | 0.0019ms | 0.023 | 0.021 | 0.0019ms | 0.0018ms |
| multi_thread_conversation (5 thread × 3 message) | cpu | 0.08ms | 0.0077ms | 0.094 | 0.083 | 0.0076ms | 0.0067ms |
| tool_call_chain (10 toolCall build) | cpu | 0.08ms | 0.0016ms | 0.019 | 0.019 | 0.0016ms | 0.0015ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | 0.01ms | 100ms | PASS |
| multi_thread_conversation (5 thread × 3 message) | 0.04ms | 200ms | PASS |
| tool_call_chain (10 toolCall build) | 0.02ms | 60ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| assistant_run_cycle (create + thread + run + poll) | -6232 B | 0 B | 102400 B | yes | PASS |
| multi_thread_conversation (5 thread × 3 message) | -6016 B | 0 B | 102400 B | yes | PASS |
| tool_call_chain (10 toolCall build) | 9528 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### assistant_run_cycle (create + thread + run + poll)

# Perf Report — assistant_run_cycle (create + thread + run + poll).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0019ms |
| p50 | 0.0054ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0078ms |
| stdev | 0.0070ms |
| min | 0.0018ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0019ms | 0.0018ms | +0.00012ms | +6.90% |
| p50 | 0.0054ms | 0.0034ms | +0.0020ms | +59.12% |
| p95 | 0.02ms | 0.02ms | +0.0032ms | +20.05% |
| p99 | 0.02ms | 0.02ms | +0.00010ms | +0.41% |
| mean | 0.0078ms | 0.0065ms | +0.0013ms | +19.57% |
| min | 0.0018ms | 0.0016ms | +0.00021ms | +13.20% |
| max | 0.03ms | 0.03ms | -0.00067ms | -2.49% |
| total | 0.16ms | 0.13ms | +0.03ms | +19.57% |

### multi_thread_conversation (5 thread × 3 message)

# Perf Report — multi_thread_conversation (5 thread × 3 message).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0077ms |
| p50 | 0.0091ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0095ms |
| stdev | 0.0021ms |
| min | 0.0070ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0067ms | +0.0010ms | +15.61% |
| p50 | 0.0091ms | 0.0072ms | +0.0018ms | +25.00% |
| p95 | 0.01ms | 0.02ms | -0.0015ms | -9.89% |
| p99 | 0.01ms | 0.02ms | -0.0016ms | -9.91% |
| mean | 0.0095ms | 0.0083ms | +0.0012ms | +14.49% |
| min | 0.0070ms | 0.0063ms | +0.00071ms | +11.25% |
| max | 0.01ms | 0.02ms | -0.0016ms | -9.92% |
| total | 0.19ms | 0.17ms | +0.02ms | +14.49% |

### tool_call_chain (10 toolCall build)

# Perf Report — tool_call_chain (10 toolCall build).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0016ms |
| p50 | 0.0017ms |
| p95 | 0.0018ms |
| p99 | 0.0019ms |
| mean | 0.0017ms |
| stdev | 0.000091ms |
| min | 0.0016ms |
| max | 0.0019ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0016ms | 0.0015ms | +0.000041ms | +2.67% |
| p50 | 0.0017ms | 0.0016ms | +0.000082ms | +5.18% |
| p95 | 0.0018ms | 0.0018ms | +0.000029ms | +1.63% |
| p99 | 0.0019ms | 0.0021ms | -0.00016ms | -7.82% |
| mean | 0.0017ms | 0.0016ms | +0.000037ms | +2.28% |
| min | 0.0016ms | 0.0015ms | +0.000042ms | +2.73% |
| max | 0.0019ms | 0.0021ms | -0.00021ms | -9.84% |
| total | 0.03ms | 0.03ms | +0.00075ms | +2.28% |

