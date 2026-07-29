# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0041ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0011ms | 0.0018ms | 5ms | 0.00033ms | PASS | stable (p10 +8% (閾値未満)、 p95 +41% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +31% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable (p10 0% (閾値未満)、 p95 +163% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.06ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -5280 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -16232 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 37160 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 99816 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0013ms |
| p95 | 0.0041ms |
| p99 | 0.0084ms |
| mean | 0.0017ms |
| stdev | 0.0014ms |
| min | 0.00096ms |
| max | 0.0094ms |
| total | 0.35ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.0010ms | 0.00ms | 0.00% |
| p50 | 0.0013ms | 0.0011ms | +0.00025ms | +23.08% |
| p95 | 0.0041ms | 0.0040ms | +0.00019ms | +4.80% |
| p99 | 0.0084ms | 0.0080ms | +0.00038ms | +4.73% |
| mean | 0.0017ms | 0.0015ms | +0.00025ms | +16.63% |
| min | 0.00096ms | 0.00096ms | 0.00ms | 0.00% |
| max | 0.0094ms | 0.0084ms | +0.0010ms | +11.94% |
| total | 0.35ms | 0.30ms | +0.05ms | +16.63% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0011ms |
| p95 | 0.0018ms |
| p99 | 0.0036ms |
| mean | 0.0013ms |
| stdev | 0.00090ms |
| min | 0.0010ms |
| max | 0.01ms |
| total | 0.26ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0010ms | +0.000083ms | +8.30% |
| p50 | 0.0011ms | 0.0010ms | +0.000083ms | +7.97% |
| p95 | 0.0018ms | 0.0013ms | +0.00053ms | +40.55% |
| p99 | 0.0036ms | 0.0026ms | +0.00095ms | +36.19% |
| mean | 0.0013ms | 0.0012ms | +0.00011ms | +9.26% |
| min | 0.0010ms | 0.00096ms | +0.000084ms | +8.77% |
| max | 0.01ms | 0.0096ms | +0.0019ms | +20.00% |
| total | 0.26ms | 0.24ms | +0.02ms | +9.26% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.00088ms |
| p99 | 0.0054ms |
| mean | 0.00053ms |
| stdev | 0.00080ms |
| min | 0.00029ms |
| max | 0.0069ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | 0.00ms | 0.00% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.00088ms | 0.00067ms | +0.00021ms | +30.58% |
| p99 | 0.0054ms | 0.0037ms | +0.0017ms | +46.17% |
| mean | 0.00053ms | 0.00050ms | +0.000029ms | +5.77% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.0069ms | 0.01ms | -0.0043ms | -38.66% |
| total | 0.11ms | 0.10ms | +0.0058ms | +5.77% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0015ms |
| p99 | 0.0072ms |
| mean | 0.0011ms |
| stdev | 0.0056ms |
| min | 0.00038ms |
| max | 0.08ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00042ms | 0.00ms | 0.00% |
| p95 | 0.0015ms | 0.00059ms | +0.00096ms | +162.55% |
| p99 | 0.0072ms | 0.0054ms | +0.0018ms | +33.01% |
| mean | 0.0011ms | 0.00056ms | +0.00052ms | +93.49% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.08ms | 0.0077ms | +0.07ms | +893.55% |
| total | 0.22ms | 0.11ms | +0.10ms | +93.49% |

