# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0043ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0010ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.0013ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +86% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.00084ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | 1168 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -16432 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37416 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 99912 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0043ms |
| p99 | 0.0085ms |
| mean | 0.0015ms |
| stdev | 0.0014ms |
| min | 0.00096ms |
| max | 0.0098ms |
| total | 0.30ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0011ms | 0.0011ms | 0.00ms | 0.00% |
| p95 | 0.0043ms | 0.0040ms | +0.00034ms | +8.60% |
| p99 | 0.0085ms | 0.0080ms | +0.00050ms | +6.24% |
| mean | 0.0015ms | 0.0015ms | +0.000025ms | +1.67% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.0098ms | 0.0084ms | +0.0014ms | +16.91% |
| total | 0.30ms | 0.30ms | +0.0050ms | +1.67% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0015ms |
| p99 | 0.0028ms |
| mean | 0.0011ms |
| stdev | 0.00073ms |
| min | 0.00092ms |
| max | 0.0089ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.0013ms | +0.00024ms | +18.31% |
| p99 | 0.0028ms | 0.0026ms | +0.00012ms | +4.69% |
| mean | 0.0011ms | 0.0012ms | -0.000031ms | -2.67% |
| min | 0.00092ms | 0.00096ms | -0.000042ms | -4.38% |
| max | 0.0089ms | 0.0096ms | -0.00067ms | -6.96% |
| total | 0.23ms | 0.24ms | -0.0063ms | -2.67% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0013ms |
| p99 | 0.0063ms |
| mean | 0.00056ms |
| stdev | 0.00087ms |
| min | 0.00029ms |
| max | 0.0071ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.00067ms | +0.00058ms | +85.98% |
| p99 | 0.0063ms | 0.0037ms | +0.0026ms | +69.77% |
| mean | 0.00056ms | 0.00050ms | +0.000061ms | +12.08% |
| min | 0.00029ms | 0.00029ms | -0.0000010ms | -0.34% |
| max | 0.0071ms | 0.01ms | -0.0041ms | -36.43% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.08% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00084ms |
| p99 | 0.0066ms |
| mean | 0.00065ms |
| stdev | 0.0013ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.13ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.00084ms | 0.00059ms | +0.00025ms | +42.36% |
| p99 | 0.0066ms | 0.0054ms | +0.0012ms | +22.17% |
| mean | 0.00065ms | 0.00056ms | +0.000091ms | +16.35% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.01ms | 0.0077ms | +0.0072ms | +92.98% |
| total | 0.13ms | 0.11ms | +0.02ms | +16.35% |

