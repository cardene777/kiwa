# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0011ms | 0.0048ms | 5ms | 0.00033ms | PASS | stable (p10 +12% (閾値未満)、 p95 +20% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0012ms | 0.0019ms | 5ms | 0.00033ms | PASS | stable (p10 +17% (閾値未満)、 p95 +43% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00038ms | 0.00088ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00088ms | 0.0021ms | 5ms | 0.00033ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| stateMachineInvoke | 0.03ms | 10ms | PASS |
| stateGraphInvoke | 0.02ms | 10ms | PASS |
| assistantsCreateThread | 0.01ms | 10ms | PASS |
| assistantsAddMessage | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| stateMachineInvoke | -848 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -15232 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 52680 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 96664 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0011ms |
| p50 | 0.0012ms |
| p95 | 0.0048ms |
| p99 | 0.0089ms |
| mean | 0.0018ms |
| stdev | 0.0022ms |
| min | 0.0011ms |
| max | 0.03ms |
| total | 0.37ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0011ms | 0.0010ms | +0.00012ms | +12.50% |
| p50 | 0.0012ms | 0.0011ms | +0.00015ms | +13.53% |
| p95 | 0.0048ms | 0.0040ms | +0.00079ms | +20.06% |
| p99 | 0.0089ms | 0.0080ms | +0.00087ms | +10.92% |
| mean | 0.0018ms | 0.0015ms | +0.00035ms | +23.09% |
| min | 0.0011ms | 0.00096ms | +0.00017ms | +17.43% |
| max | 0.03ms | 0.0084ms | +0.02ms | +212.94% |
| total | 0.37ms | 0.30ms | +0.07ms | +23.09% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0012ms |
| p50 | 0.0012ms |
| p95 | 0.0019ms |
| p99 | 0.01ms |
| mean | 0.0050ms |
| stdev | 0.04ms |
| min | 0.0011ms |
| max | 0.44ms |
| total | 1.00ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0012ms | 0.0010ms | +0.00017ms | +16.60% |
| p50 | 0.0012ms | 0.0010ms | +0.00017ms | +15.93% |
| p95 | 0.0019ms | 0.0013ms | +0.00057ms | +43.43% |
| p99 | 0.01ms | 0.0026ms | +0.01ms | +408.67% |
| mean | 0.0050ms | 0.0012ms | +0.0038ms | +326.09% |
| min | 0.0011ms | 0.00096ms | +0.00017ms | +17.43% |
| max | 0.44ms | 0.0096ms | +0.43ms | +4495.82% |
| total | 1.00ms | 0.24ms | +0.77ms | +326.09% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00088ms |
| p99 | 0.0060ms |
| mean | 0.00057ms |
| stdev | 0.00087ms |
| min | 0.00033ms |
| max | 0.0081ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00033ms | +0.000042ms | +12.61% |
| p50 | 0.00042ms | 0.00038ms | +0.000042ms | +11.20% |
| p95 | 0.00088ms | 0.00067ms | +0.00021ms | +30.59% |
| p99 | 0.0060ms | 0.0037ms | +0.0023ms | +61.89% |
| mean | 0.00057ms | 0.00050ms | +0.000066ms | +13.25% |
| min | 0.00033ms | 0.00029ms | +0.000041ms | +14.04% |
| max | 0.0081ms | 0.01ms | -0.0031ms | -27.88% |
| total | 0.11ms | 0.10ms | +0.01ms | +13.25% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.00096ms |
| p95 | 0.0021ms |
| p99 | 0.01ms |
| mean | 0.0016ms |
| stdev | 0.0042ms |
| min | 0.00083ms |
| max | 0.06ms |
| total | 0.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00088ms | 0.00038ms | +0.00050ms | +133.33% |
| p50 | 0.00096ms | 0.00042ms | +0.00054ms | +129.74% |
| p95 | 0.0021ms | 0.00059ms | +0.0015ms | +248.64% |
| p99 | 0.01ms | 0.0054ms | +0.0089ms | +163.87% |
| mean | 0.0016ms | 0.00056ms | +0.0010ms | +180.42% |
| min | 0.00083ms | 0.00038ms | +0.00046ms | +122.13% |
| max | 0.06ms | 0.0077ms | +0.05ms | +632.46% |
| total | 0.31ms | 0.11ms | +0.20ms | +180.42% |

