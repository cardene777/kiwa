# Perf Suite — grpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00042ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00083ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| invokeUnary | 0.00050ms | 0.0052ms | 5ms | 0.00083ms | PASS | stable (検知には +0.00083ms (baseline 比 +165%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| invokeServerStream | 0.00088ms | 0.0099ms | 5ms | 0.00083ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| invokeUnary | cpu | 0.08ms | 0.10ms | 0.00050ms | 0.006 | 0.006 | 0.00050ms | 0.00050ms |
| invokeServerStream | cpu | 0.08ms | 0.10ms | 0.00088ms | 0.011 | 0.011 | 0.00087ms | 0.00092ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| invokeUnary | 0.02ms | 10ms | PASS |
| invokeServerStream | 0.02ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| invokeUnary | -1824 B | 0 B | 102400 B | yes | PASS |
| invokeServerStream | 744 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### invokeUnary

# Perf Report — invokeUnary.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00063ms |
| p95 | 0.0052ms |
| p99 | 0.01ms |
| mean | 0.0013ms |
| stdev | 0.0024ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.992)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | -0.0000040ms | -0.81% |
| p50 | 0.00062ms | 0.00058ms | +0.000036ms | +6.16% |
| p95 | 0.0051ms | 0.0099ms | -0.0047ms | -48.00% |
| p99 | 0.01ms | 0.02ms | -0.0052ms | -27.80% |
| mean | 0.0013ms | 0.0022ms | -0.00084ms | -39.08% |
| min | 0.00045ms | 0.00050ms | -0.000046ms | -9.14% |
| max | 0.02ms | 0.04ms | -0.02ms | -56.28% |
| total | 0.26ms | 0.43ms | -0.17ms | -39.08% |

### invokeServerStream

# Perf Report — invokeServerStream.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00088ms |
| p50 | 0.0010ms |
| p95 | 0.0099ms |
| p99 | 0.02ms |
| mean | 0.0024ms |
| stdev | 0.0063ms |
| min | 0.00083ms |
| max | 0.07ms |
| total | 0.49ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.990)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00087ms | 0.00092ms | -0.000051ms | -5.53% |
| p50 | 0.00099ms | 0.0010ms | -0.000052ms | -4.99% |
| p95 | 0.0098ms | 0.0089ms | +0.00084ms | +9.38% |
| p99 | 0.02ms | 0.02ms | +0.0030ms | +16.09% |
| mean | 0.0024ms | 0.0020ms | +0.00041ms | +20.11% |
| min | 0.00082ms | 0.00088ms | -0.000050ms | -5.75% |
| max | 0.07ms | 0.02ms | +0.05ms | +236.57% |
| total | 0.48ms | 0.40ms | +0.08ms | +20.11% |

