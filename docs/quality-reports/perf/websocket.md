# Perf Suite — websocket

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| sendMessage | 0.00029ms | 0.0010ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +122%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| broadcastMessage | 0.00033ms | 0.0010ms | 5ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| captureBinaryFrame | 0.00029ms | 0.0088ms | 5ms | 0.00031ms | PASS | stable (検知には +0.00031ms (baseline 比 +106%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| sendMessage | cpu | 0.09ms | 0.09ms | 0.00029ms | 0.003 | 0.003 | 0.00027ms | 0.00025ms |
| broadcastMessage | cpu | 0.09ms | 0.09ms | 0.00033ms | 0.004 | 0.004 | 0.00031ms | 0.00033ms |
| captureBinaryFrame | cpu | 0.09ms | 0.16ms | 0.00029ms | 0.003 | 0.004 | 0.00027ms | 0.00029ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| sendMessage | 0.01ms | 10ms | PASS |
| broadcastMessage | 0.01ms | 10ms | PASS |
| captureBinaryFrame | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| sendMessage | -2824 B | 0 B | 102400 B | yes | PASS |
| broadcastMessage | -192 B | 0 B | 102400 B | yes | PASS |
| captureBinaryFrame | 3624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### sendMessage

# Perf Report — sendMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00033ms |
| p95 | 0.0010ms |
| p99 | 0.0070ms |
| mean | 0.00057ms |
| stdev | 0.0010ms |
| min | 0.00029ms |
| max | 0.0095ms |
| total | 0.11ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.915)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00027ms | 0.00025ms | +0.000017ms | +6.82% |
| p50 | 0.00031ms | 0.00029ms | +0.000013ms | +4.61% |
| p95 | 0.00095ms | 0.0026ms | -0.0017ms | -63.98% |
| p99 | 0.0064ms | 0.01ms | -0.0037ms | -36.73% |
| mean | 0.00052ms | 0.0012ms | -0.00065ms | -55.42% |
| min | 0.00027ms | 0.00025ms | +0.000016ms | +6.46% |
| max | 0.0087ms | 0.10ms | -0.09ms | -91.58% |
| total | 0.10ms | 0.24ms | -0.13ms | -55.42% |

### broadcastMessage

# Perf Report — broadcastMessage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00033ms |
| p50 | 0.00038ms |
| p95 | 0.0010ms |
| p99 | 0.0043ms |
| mean | 0.00059ms |
| stdev | 0.00098ms |
| min | 0.00033ms |
| max | 0.01ms |
| total | 0.12ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.923)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00031ms | 0.00033ms | -0.000026ms | -7.73% |
| p50 | 0.00035ms | 0.00038ms | -0.000029ms | -7.73% |
| p95 | 0.00096ms | 0.0020ms | -0.0011ms | -52.87% |
| p99 | 0.0040ms | 0.0056ms | -0.0016ms | -28.44% |
| mean | 0.00054ms | 0.00061ms | -0.000067ms | -11.08% |
| min | 0.00031ms | 0.00029ms | +0.000015ms | +5.22% |
| max | 0.01ms | 0.010ms | +0.00077ms | +7.72% |
| total | 0.11ms | 0.12ms | -0.01ms | -11.08% |

### captureBinaryFrame

# Perf Report — captureBinaryFrame.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00029ms |
| p50 | 0.00038ms |
| p95 | 0.0088ms |
| p99 | 0.05ms |
| mean | 0.0023ms |
| stdev | 0.0082ms |
| min | 0.00029ms |
| max | 0.08ms |
| total | 0.47ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.922)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00027ms | 0.00029ms | -0.000022ms | -7.45% |
| p50 | 0.00035ms | 0.00033ms | +0.000013ms | +3.86% |
| p95 | 0.0081ms | 0.0035ms | +0.0046ms | +129.20% |
| p99 | 0.05ms | 0.02ms | +0.03ms | +130.60% |
| mean | 0.0022ms | 0.0011ms | +0.0011ms | +98.31% |
| min | 0.00027ms | 0.00025ms | +0.000018ms | +7.35% |
| max | 0.08ms | 0.04ms | +0.03ms | +85.41% |
| total | 0.43ms | 0.22ms | +0.21ms | +98.31% |

