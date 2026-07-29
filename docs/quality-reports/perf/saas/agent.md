# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0017ms | 0.0080ms | 5ms | 0.00083ms | PASS | stable (差 0.00070ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0012ms | 0.0018ms | 5ms | 0.00083ms | PASS | stable (差 0.00021ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00038ms | 0.0013ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +250%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00046ms | 0.0012ms | 5ms | 0.00083ms | PASS | stable (差 0.000083ms が下限 0.00083ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.06ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.08ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -376 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | 12120 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 39456 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 98808 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0017ms |
| p50 | 0.0027ms |
| p95 | 0.0080ms |
| p99 | 0.02ms |
| mean | 0.0035ms |
| stdev | 0.0040ms |
| min | 0.0011ms |
| max | 0.05ms |
| total | 0.70ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0017ms | 0.0010ms | +0.00070ms | +70.00% |
| p50 | 0.0027ms | 0.0011ms | +0.0016ms | +150.05% |
| p95 | 0.0080ms | 0.0040ms | +0.0040ms | +101.18% |
| p99 | 0.02ms | 0.0080ms | +0.0080ms | +99.44% |
| mean | 0.0035ms | 0.0015ms | +0.0020ms | +134.67% |
| min | 0.0011ms | 0.00096ms | +0.00013ms | +13.05% |
| max | 0.05ms | 0.0084ms | +0.04ms | +510.94% |
| total | 0.70ms | 0.30ms | +0.40ms | +134.67% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0013ms |
| p95 | 0.0018ms |
| p99 | 0.0037ms |
| mean | 0.0014ms |
| stdev | 0.00054ms |
| min | 0.0012ms |
| max | 0.0073ms |
| total | 0.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0010ms | +0.00021ms | +20.80% |
| p50 | 0.0013ms | 0.0010ms | +0.00021ms | +19.96% |
| p95 | 0.0018ms | 0.0013ms | +0.00049ms | +37.25% |
| p99 | 0.0037ms | 0.0026ms | +0.0010ms | +39.73% |
| mean | 0.0014ms | 0.0012ms | +0.00018ms | +15.07% |
| min | 0.0012ms | 0.00096ms | +0.00021ms | +21.71% |
| max | 0.0073ms | 0.0096ms | -0.0023ms | -24.35% |
| total | 0.27ms | 0.24ms | +0.04ms | +15.07% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.0013ms |
| p99 | 0.0056ms |
| mean | 0.00056ms |
| stdev | 0.00080ms |
| min | 0.00033ms |
| max | 0.0074ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p95 | 0.0013ms | 0.00067ms | +0.00062ms | +92.21% |
| p99 | 0.0056ms | 0.0037ms | +0.0019ms | +52.75% |
| mean | 0.00056ms | 0.00050ms | +0.000062ms | +12.46% |
| min | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| max | 0.0074ms | 0.01ms | -0.0038ms | -34.20% |
| total | 0.11ms | 0.10ms | +0.01ms | +12.46% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00050ms |
| p95 | 0.0012ms |
| p99 | 0.0073ms |
| mean | 0.00074ms |
| stdev | 0.0015ms |
| min | 0.00042ms |
| max | 0.02ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00038ms | +0.000083ms | +22.13% |
| p50 | 0.00050ms | 0.00042ms | +0.000083ms | +19.90% |
| p95 | 0.0012ms | 0.00059ms | +0.00058ms | +98.98% |
| p99 | 0.0073ms | 0.0054ms | +0.0019ms | +34.68% |
| mean | 0.00074ms | 0.00056ms | +0.00018ms | +32.17% |
| min | 0.00042ms | 0.00038ms | +0.000041ms | +10.93% |
| max | 0.02ms | 0.0077ms | +0.01ms | +130.83% |
| total | 0.15ms | 0.11ms | +0.04ms | +32.17% |

