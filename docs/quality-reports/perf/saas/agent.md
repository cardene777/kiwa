# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0045ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0010ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +21% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.00096ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.00089ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +51% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.02ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -2392 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -16336 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 36488 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 98808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0045ms |
| p99 | 0.0080ms |
| mean | 0.0016ms |
| stdev | 0.0014ms |
| min | 0.00096ms |
| max | 0.01ms |
| total | 0.32ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | +0.000041ms | +4.10% |
| p50 | 0.0011ms | 0.0011ms | +0.000042ms | +3.88% |
| p95 | 0.0045ms | 0.0040ms | +0.00058ms | +14.64% |
| p99 | 0.0080ms | 0.0080ms | +0.000012ms | +0.15% |
| mean | 0.0016ms | 0.0015ms | +0.00012ms | +7.71% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0084ms | +0.0022ms | +25.86% |
| total | 0.32ms | 0.30ms | +0.02ms | +7.71% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0016ms |
| p99 | 0.0036ms |
| mean | 0.0012ms |
| stdev | 0.00086ms |
| min | 0.00096ms |
| max | 0.01ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0016ms | 0.0013ms | +0.00027ms | +20.96% |
| p99 | 0.0036ms | 0.0026ms | +0.00095ms | +36.15% |
| mean | 0.0012ms | 0.0012ms | -0.000010ms | -0.89% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.01ms | 0.0096ms | +0.0014ms | +14.36% |
| total | 0.23ms | 0.24ms | -0.0021ms | -0.89% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00096ms |
| p99 | 0.0053ms |
| mean | 0.00052ms |
| stdev | 0.00077ms |
| min | 0.00029ms |
| max | 0.0060ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00096ms | 0.00067ms | +0.00029ms | +42.92% |
| p99 | 0.0053ms | 0.0037ms | +0.0016ms | +42.77% |
| mean | 0.00052ms | 0.00050ms | +0.000019ms | +3.81% |
| min | 0.00029ms | 0.00029ms | -0.0000010ms | -0.34% |
| max | 0.0060ms | 0.01ms | -0.0052ms | -46.09% |
| total | 0.10ms | 0.10ms | +0.0038ms | +3.81% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00089ms |
| p99 | 0.0070ms |
| mean | 0.00071ms |
| stdev | 0.0019ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00089ms | 0.00059ms | +0.00030ms | +51.27% |
| p99 | 0.0070ms | 0.0054ms | +0.0016ms | +28.72% |
| mean | 0.00071ms | 0.00056ms | +0.00015ms | +26.72% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.02ms | 0.0077ms | +0.02ms | +222.17% |
| total | 0.14ms | 0.11ms | +0.03ms | +26.72% |

