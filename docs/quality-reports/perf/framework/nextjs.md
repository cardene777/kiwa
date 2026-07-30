# Perf Suite — nextjs

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeServerAction | 0.00058ms | 0.0022ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeMiddleware | 0.0047ms | 0.01ms | 5ms | 0.00033ms | PASS | stable (換算後 p10 +1% (閾値未満)、 p95 +42% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| renderServerComponent | 0.00038ms | 0.0016ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeServerAction | cpu | 0.08ms | 0.09ms | 0.00058ms | 0.007 | 0.007 | 0.00059ms | 0.00054ms |
| invokeMiddleware | cpu | 0.08ms | 0.11ms | 0.0047ms | 0.057 | 0.056 | 0.0047ms | 0.0046ms |
| renderServerComponent | cpu | 0.08ms | 0.09ms | 0.00038ms | 0.005 | 0.005 | 0.00038ms | 0.00038ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeServerAction | 0.02ms | 10ms | PASS |
| invokeMiddleware | 0.07ms | 10ms | PASS |
| renderServerComponent | 0.01ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeServerAction | 327480 B | -53568 B | 102400 B | yes | PASS |
| invokeMiddleware | -12048 B | 0 B | 102400 B | yes | PASS |
| renderServerComponent | -10728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeServerAction

# Perf Report — invokeServerAction.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00058ms |
| p50 | 0.00063ms |
| p95 | 0.0022ms |
| p99 | 0.0090ms |
| mean | 0.0011ms |
| stdev | 0.0024ms |
| min | 0.00054ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.004)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00059ms | 0.00054ms | +0.000043ms | +8.00% |
| p50 | 0.00063ms | 0.00063ms | +0.0000026ms | +0.41% |
| p95 | 0.0022ms | 0.0031ms | -0.00093ms | -30.02% |
| p99 | 0.0090ms | 0.0085ms | +0.00054ms | +6.43% |
| mean | 0.0011ms | 0.0012ms | -0.000066ms | -5.52% |
| min | 0.00054ms | 0.00054ms | +0.0000022ms | +0.41% |
| max | 0.03ms | 0.03ms | +0.0037ms | +14.24% |
| total | 0.23ms | 0.24ms | -0.01ms | -5.52% |

### invokeMiddleware

# Perf Report — invokeMiddleware.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0053ms |
| p95 | 0.01ms |
| p99 | 0.08ms |
| mean | 0.0085ms |
| stdev | 0.02ms |
| min | 0.0045ms |
| max | 0.17ms |
| total | 1.71ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0046ms | +0.000038ms | +0.83% |
| p50 | 0.0052ms | 0.0050ms | +0.00016ms | +3.13% |
| p95 | 0.01ms | 0.01ms | +0.0043ms | +41.60% |
| p99 | 0.08ms | 0.03ms | +0.06ms | +204.15% |
| mean | 0.0085ms | 0.0061ms | +0.0024ms | +39.71% |
| min | 0.0044ms | 0.0044ms | -4.1e-7ms | -0.01% |
| max | 0.17ms | 0.06ms | +0.10ms | +167.79% |
| total | 1.69ms | 1.21ms | +0.48ms | +39.71% |

### renderServerComponent

# Perf Report — renderServerComponent.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.0016ms |
| p99 | 0.0070ms |
| mean | 0.00078ms |
| stdev | 0.0020ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| p50 | 0.00042ms | 0.00046ms | -0.000041ms | -8.95% |
| p95 | 0.0016ms | 0.0018ms | -0.00012ms | -7.11% |
| p99 | 0.0070ms | 0.0092ms | -0.0023ms | -24.49% |
| mean | 0.00078ms | 0.00084ms | -0.000061ms | -7.25% |
| min | 0.00038ms | 0.00038ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | +0.0032ms | +18.96% |
| total | 0.16ms | 0.17ms | -0.01ms | -7.25% |

