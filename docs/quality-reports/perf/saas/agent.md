# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0060ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.00096ms | 0.0026ms | 5ms | 0.00033ms | PASS | stable (p10 +4% (閾値未満)、 p95 +25% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00029ms | 0.00092ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.0010ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| stateMachineInvoke | cpu | 0.08ms | 0.0010ms | 0.013 | 0.012 | 0.0010ms | 0.00096ms |
| stateGraphInvoke | cpu | 0.08ms | 0.00096ms | 0.012 | 0.011 | 0.00095ms | 0.00092ms |
| assistantsCreateThread | cpu | 0.08ms | 0.00029ms | 0.004 | 0.004 | 0.00029ms | 0.00033ms |
| assistantsAddMessage | cpu | 0.08ms | 0.00038ms | 0.005 | 0.005 | 0.00037ms | 0.00042ms |

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
| stateMachineInvoke | -6096 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -16200 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 54432 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 98840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0012ms |
| p95 | 0.0060ms |
| p99 | 0.01ms |
| mean | 0.0021ms |
| stdev | 0.0023ms |
| min | 0.0010ms |
| max | 0.02ms |
| total | 0.41ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000083ms | +8.66% |
| p50 | 0.0012ms | 0.0010ms | +0.00017ms | +15.93% |
| p95 | 0.0060ms | 0.0049ms | +0.0010ms | +20.88% |
| p99 | 0.01ms | 0.01ms | +0.000057ms | +0.46% |
| mean | 0.0021ms | 0.0018ms | +0.00029ms | +16.35% |
| min | 0.0010ms | 0.00092ms | +0.000084ms | +9.17% |
| max | 0.02ms | 0.02ms | -0.0015ms | -7.07% |
| total | 0.41ms | 0.35ms | +0.06ms | +16.35% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00096ms |
| p50 | 0.0010ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0019ms |
| stdev | 0.0083ms |
| min | 0.00092ms |
| max | 0.12ms |
| total | 0.38ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00096ms | 0.00092ms | +0.000042ms | +4.59% |
| p50 | 0.0010ms | 0.00096ms | +0.000041ms | +4.28% |
| p95 | 0.0026ms | 0.0020ms | +0.00054ms | +26.57% |
| p99 | 0.01ms | 0.0096ms | +0.0018ms | +18.32% |
| mean | 0.0019ms | 0.0013ms | +0.00062ms | +49.06% |
| min | 0.00092ms | 0.00088ms | +0.000041ms | +4.69% |
| max | 0.12ms | 0.02ms | +0.10ms | +569.84% |
| total | 0.38ms | 0.25ms | +0.12ms | +49.06% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.00092ms |
| p99 | 0.0058ms |
| mean | 0.00056ms |
| stdev | 0.0013ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00029ms | 0.00033ms | -0.000041ms | -12.31% |
| p50 | 0.00033ms | 0.00038ms | -0.000041ms | -10.93% |
| p95 | 0.00092ms | 0.0030ms | -0.0021ms | -69.48% |
| p99 | 0.0058ms | 0.01ms | -0.0091ms | -61.19% |
| mean | 0.00056ms | 0.0011ms | -0.00053ms | -48.50% |
| min | 0.00029ms | 0.00029ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.04ms | -0.02ms | -57.14% |
| total | 0.11ms | 0.22ms | -0.11ms | -48.50% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00050ms |
| p95 | 0.0010ms |
| p99 | 0.0066ms |
| mean | 0.00080ms |
| stdev | 0.0024ms |
| min | 0.00033ms |
| max | 0.03ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00050ms | 0.00058ms | -0.000083ms | -14.24% |
| p95 | 0.0010ms | 0.0037ms | -0.0027ms | -72.86% |
| p99 | 0.0066ms | 0.01ms | -0.0058ms | -46.49% |
| mean | 0.00080ms | 0.0011ms | -0.00029ms | -26.23% |
| min | 0.00033ms | 0.00038ms | -0.000042ms | -11.20% |
| max | 0.03ms | 0.02ms | +0.02ms | +97.26% |
| total | 0.16ms | 0.22ms | -0.06ms | -26.23% |

