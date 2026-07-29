# Perf Suite — form

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| validateSchema | 0.00046ms | 0.0026ms | 5ms | 0.00032ms | PASS | stable (p10 -3% (閾値未満)、 p95 +47% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| registerFieldAndSubmit | 0.0060ms | 0.05ms | 5ms | 0.00032ms | PASS | stable (p10 +2% (閾値未満)、 p95 +179% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| getFieldErrorAfterFailure | 0.0077ms | 0.03ms | 5ms | 0.00032ms | PASS | regressed — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| validateSchema | cpu | 0.08ms | 0.00046ms | 0.006 | 0.006 | 0.00044ms | 0.00046ms |
| registerFieldAndSubmit | cpu | 0.08ms | 0.0060ms | 0.072 | 0.071 | 0.0058ms | 0.0057ms |
| getFieldErrorAfterFailure | cpu | 0.08ms | 0.0077ms | 0.093 | 0.055 | 0.0075ms | 0.0044ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| validateSchema | 0.01ms | 10ms | PASS |
| registerFieldAndSubmit | 0.10ms | 10ms | PASS |
| getFieldErrorAfterFailure | 0.42ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| validateSchema | -7592 B | 0 B | 102400 B | yes | PASS |
| registerFieldAndSubmit | 55592 B | 0 B | 102400 B | yes | PASS |
| getFieldErrorAfterFailure | -704 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### validateSchema

# Perf Report — validateSchema.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00046ms |
| p50 | 0.00054ms |
| p95 | 0.0026ms |
| p99 | 0.01ms |
| mean | 0.0011ms |
| stdev | 0.0024ms |
| min | 0.00033ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00046ms | 0.00046ms | 0.00ms | 0.00% |
| p50 | 0.00054ms | 0.00050ms | +0.000041ms | +8.20% |
| p95 | 0.0026ms | 0.0017ms | +0.00089ms | +52.18% |
| p99 | 0.01ms | 0.0061ms | +0.0079ms | +129.61% |
| mean | 0.0011ms | 0.00079ms | +0.00033ms | +41.34% |
| min | 0.00033ms | 0.00029ms | +0.000043ms | +14.78% |
| max | 0.02ms | 0.01ms | +0.0038ms | +27.30% |
| total | 0.22ms | 0.16ms | +0.07ms | +41.34% |

### registerFieldAndSubmit

# Perf Report — registerFieldAndSubmit.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.0092ms |
| p95 | 0.05ms |
| p99 | 11.82ms |
| mean | 0.34ms |
| stdev | 2.43ms |
| min | 0.0057ms |
| max | 23.05ms |
| total | 68.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0057ms | +0.00033ms | +5.89% |
| p50 | 0.0092ms | 0.0060ms | +0.0031ms | +51.72% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +187.86% |
| p99 | 11.82ms | 0.04ms | +11.78ms | +33502.32% |
| mean | 0.34ms | 0.0081ms | +0.33ms | +4108.93% |
| min | 0.0057ms | 0.0055ms | +0.00013ms | +2.27% |
| max | 23.05ms | 0.09ms | +22.96ms | +24653.69% |
| total | 68.01ms | 1.62ms | +66.40ms | +4108.93% |

### getFieldErrorAfterFailure

# Perf Report — getFieldErrorAfterFailure.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 3.30ms |
| mean | 0.20ms |
| stdev | 1.69ms |
| min | 0.0046ms |
| max | 18.97ms |
| total | 39.43ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0044ms | +0.0033ms | +75.46% |
| p50 | 0.01ms | 0.0051ms | +0.0050ms | +99.18% |
| p95 | 0.03ms | 0.0094ms | +0.02ms | +239.22% |
| p99 | 3.30ms | 0.01ms | +3.28ms | +25710.64% |
| mean | 0.20ms | 0.0056ms | +0.19ms | +3405.77% |
| min | 0.0046ms | 0.0043ms | +0.00037ms | +8.82% |
| max | 18.97ms | 0.02ms | +18.95ms | +96773.35% |
| total | 39.43ms | 1.12ms | +38.30ms | +3405.77% |

