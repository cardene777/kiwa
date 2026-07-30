# Perf Suite — agent

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| stateMachineInvoke | 0.0010ms | 0.0039ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| stateGraphInvoke | 0.0010ms | 0.0023ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| assistantsCreateThread | 0.00033ms | 0.0024ms | 5ms | 0.00033ms | PASS | stable (検知には +0.00033ms (baseline 比 +100%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| assistantsAddMessage | 0.00038ms | 0.0014ms | 5ms | 0.00034ms | PASS | stable (差 0.00012ms が下限 0.00034ms 未満で判定を保留) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| stateMachineInvoke | cpu | 0.08ms | 0.09ms | 0.0010ms | 0.012 | 0.012 | 0.00097ms | 0.0010ms |
| stateGraphInvoke | cpu | 0.08ms | 0.08ms | 0.0010ms | 0.012 | 0.012 | 0.0010ms | 0.00096ms |
| assistantsCreateThread | cpu | 0.08ms | 0.08ms | 0.00033ms | 0.004 | 0.004 | 0.00033ms | 0.00033ms |
| assistantsAddMessage | cpu | 0.08ms | 0.08ms | 0.00038ms | 0.005 | 0.006 | 0.00038ms | 0.00050ms |

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
| stateMachineInvoke | -7160 B | 0 B | 102400 B | yes | PASS |
| stateGraphInvoke | -16216 B | 0 B | 102400 B | yes | PASS |
| assistantsCreateThread | 187856 B | 0 B | 102400 B | yes | PASS |
| assistantsAddMessage | 99848 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### stateMachineInvoke

# Perf Report — stateMachineInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0011ms |
| p95 | 0.0039ms |
| p99 | 0.01ms |
| mean | 0.0020ms |
| stdev | 0.0026ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.41ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.970)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00097ms | 0.0010ms | -0.000030ms | -2.98% |
| p50 | 0.0011ms | 0.0011ms | -0.000034ms | -2.98% |
| p95 | 0.0038ms | 0.0055ms | -0.0017ms | -31.46% |
| p99 | 0.01ms | 0.01ms | +0.00050ms | +3.76% |
| mean | 0.0020ms | 0.0021ms | -0.00014ms | -6.86% |
| min | 0.00093ms | 0.00096ms | -0.000029ms | -2.98% |
| max | 0.02ms | 0.02ms | +0.00034ms | +1.64% |
| total | 0.39ms | 0.42ms | -0.03ms | -6.86% |

### stateGraphInvoke

# Perf Report — stateGraphInvoke.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0010ms |
| p50 | 0.0010ms |
| p95 | 0.0023ms |
| p99 | 0.01ms |
| mean | 0.0014ms |
| stdev | 0.0018ms |
| min | 0.00096ms |
| max | 0.02ms |
| total | 0.27ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.003)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0010ms | 0.00096ms | +0.000041ms | +4.25% |
| p50 | 0.0010ms | 0.0010ms | +0.0000028ms | +0.28% |
| p95 | 0.0023ms | 0.0019ms | +0.00035ms | +18.23% |
| p99 | 0.01ms | 0.0078ms | +0.0051ms | +65.22% |
| mean | 0.0014ms | 0.0013ms | +0.000052ms | +3.96% |
| min | 0.00096ms | 0.00092ms | +0.000045ms | +4.88% |
| max | 0.02ms | 0.02ms | -0.0067ms | -28.89% |
| total | 0.27ms | 0.26ms | +0.01ms | +3.96% |

### assistantsCreateThread

# Perf Report — assistantsCreateThread.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0024ms |
| p99 | 0.01ms |
| mean | 0.00085ms |
| stdev | 0.0021ms |
| min | 0.00029ms |
| max | 0.02ms |
| total | 0.17ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.004)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00033ms | 0.00033ms | +0.0000012ms | +0.36% |
| p50 | 0.00038ms | 0.00042ms | -0.000041ms | -9.75% |
| p95 | 0.0024ms | 0.0015ms | +0.00086ms | +55.68% |
| p99 | 0.01ms | 0.0098ms | +0.0014ms | +14.56% |
| mean | 0.00085ms | 0.00083ms | +0.000016ms | +1.94% |
| min | 0.00029ms | 0.00029ms | +4.5e-8ms | +0.02% |
| max | 0.02ms | 0.02ms | -0.0018ms | -7.99% |
| total | 0.17ms | 0.17ms | +0.0032ms | +1.94% |

### assistantsAddMessage

# Perf Report — assistantsAddMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00056ms |
| p95 | 0.0014ms |
| p99 | 0.01ms |
| mean | 0.00098ms |
| stdev | 0.0023ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.018)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00050ms | -0.00012ms | -23.64% |
| p50 | 0.00057ms | 0.00075ms | -0.00018ms | -23.64% |
| p95 | 0.0015ms | 0.0025ms | -0.0011ms | -42.19% |
| p99 | 0.01ms | 0.02ms | -0.00016ms | -1.09% |
| mean | 0.0010ms | 0.0012ms | -0.00023ms | -18.56% |
| min | 0.00034ms | 0.00042ms | -0.000077ms | -18.50% |
| max | 0.02ms | 0.03ms | -0.0060ms | -22.13% |
| total | 0.20ms | 0.24ms | -0.05ms | -18.56% |

