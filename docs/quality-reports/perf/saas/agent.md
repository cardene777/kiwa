# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0040ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0010ms | 0.0014ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.0010ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +70% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

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
| stateMachineInvoke | 1224 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -15232 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37512 B | 0 B | 102400 B | yes | PASS |
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
| p95 | 0.0040ms |
| p99 | 0.0082ms |
| mean | 0.0015ms |
| stdev | 0.0012ms |
| min | 0.00096ms |
| max | 0.0098ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0011ms | 0.0011ms | +0.0000010ms | +0.09% |
| p95 | 0.0040ms | 0.0040ms | +0.000048ms | +1.22% |
| p99 | 0.0082ms | 0.0080ms | +0.00021ms | +2.60% |
| mean | 0.0015ms | 0.0015ms | +0.000033ms | +2.21% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.0084ms | +0.0014ms | +16.91% |
| total | 0.31ms | 0.30ms | +0.0066ms | +2.21% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0014ms |
| p99 | 0.0035ms |
| mean | 0.0012ms |
| stdev | 0.00067ms |
| min | 0.0010ms |
| max | 0.0077ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0011ms | 0.0010ms | +0.000041ms | +3.93% |
| p95 | 0.0014ms | 0.0013ms | +0.00012ms | +9.16% |
| p99 | 0.0035ms | 0.0026ms | +0.00091ms | +34.47% |
| mean | 0.0012ms | 0.0012ms | +0.000015ms | +1.28% |
| min | 0.0010ms | 0.00096ms | +0.000042ms | +4.38% |
| max | 0.0077ms | 0.0096ms | -0.0019ms | -19.57% |
| total | 0.24ms | 0.24ms | +0.0030ms | +1.28% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00067ms |
| p99 | 0.0046ms |
| mean | 0.00051ms |
| stdev | 0.00079ms |
| min | 0.00029ms |
| max | 0.0083ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00067ms | 0.00067ms | -9.5e-7ms | -0.14% |
| p99 | 0.0046ms | 0.0037ms | +0.00095ms | +25.76% |
| mean | 0.00051ms | 0.00050ms | +0.0000036ms | +0.71% |
| min | 0.00029ms | 0.00029ms | -0.0000010ms | -0.34% |
| max | 0.0083ms | 0.01ms | -0.0029ms | -26.02% |
| total | 0.10ms | 0.10ms | +0.00071ms | +0.71% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0010ms |
| p99 | 0.0059ms |
| mean | 0.00061ms |
| stdev | 0.00094ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0010ms | 0.00059ms | +0.00041ms | +70.39% |
| p99 | 0.0059ms | 0.0054ms | +0.00044ms | +8.17% |
| mean | 0.00061ms | 0.00056ms | +0.000047ms | +8.40% |
| min | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| max | 0.01ms | 0.0077ms | +0.0028ms | +36.22% |
| total | 0.12ms | 0.11ms | +0.0094ms | +8.40% |

