# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.04ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.03ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.01ms | 0.03ms | 100ms | 0.00034ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0082ms | 0.02ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.08ms | 0.02ms | 0.244 | 0.212 | 0.02ms | 0.02ms |
| driveKv | cpu | 0.08ms | 0.02ms | 0.208 | 0.213 | 0.02ms | 0.02ms |
| driveD1 | cpu | 0.08ms | 0.01ms | 0.155 | 0.152 | 0.01ms | 0.01ms |
| driveR2 | cpu | 0.08ms | 0.01ms | 0.163 | 0.163 | 0.01ms | 0.01ms |
| driveExecutionCtx | cpu | 0.08ms | 0.0082ms | 0.099 | 0.096 | 0.0081ms | 0.0078ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 0.82ms | 160ms | PASS |
| driveKv | 0.26ms | 160ms | PASS |
| driveD1 | 0.17ms | 160ms | PASS |
| driveR2 | 0.16ms | 200ms | PASS |
| driveExecutionCtx | 0.11ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2440 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51144 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1664 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 1744 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | -320 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.04ms |
| p99 | 0.12ms |
| mean | 0.03ms |
| stdev | 0.03ms |
| min | 0.02ms |
| max | 0.48ms |
| total | 5.53ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.0020ms | +11.36% |
| p50 | 0.02ms | 0.02ms | -0.0022ms | -9.11% |
| p95 | 0.04ms | 0.09ms | -0.05ms | -56.00% |
| p99 | 0.12ms | 0.38ms | -0.26ms | -68.36% |
| mean | 0.03ms | 0.04ms | -0.01ms | -32.12% |
| min | 0.02ms | 0.02ms | +0.0016ms | +9.58% |
| max | 0.48ms | 0.88ms | -0.40ms | -45.33% |
| total | 5.53ms | 8.15ms | -2.62ms | -32.12% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.13ms |
| total | 3.97ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.00070ms | -4.02% |
| p50 | 0.02ms | 0.02ms | -0.0018ms | -9.47% |
| p95 | 0.03ms | 0.04ms | -0.02ms | -37.51% |
| p99 | 0.05ms | 0.09ms | -0.04ms | -45.85% |
| mean | 0.02ms | 0.02ms | -0.0049ms | -19.67% |
| min | 0.02ms | 0.02ms | -0.00033ms | -1.99% |
| max | 0.13ms | 0.39ms | -0.26ms | -67.73% |
| total | 3.97ms | 4.95ms | -0.97ms | -19.67% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.0069ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 3.01ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0000041ms | -0.03% |
| p50 | 0.01ms | 0.01ms | -0.00017ms | -1.26% |
| p95 | 0.02ms | 0.04ms | -0.02ms | -42.08% |
| p99 | 0.05ms | 0.11ms | -0.06ms | -54.86% |
| mean | 0.02ms | 0.02ms | -0.0032ms | -17.60% |
| min | 0.01ms | 0.01ms | +0.00017ms | +1.36% |
| max | 0.07ms | 0.16ms | -0.10ms | -59.31% |
| total | 3.01ms | 3.66ms | -0.64ms | -17.60% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.12ms |
| total | 3.31ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00042ms | -3.08% |
| p50 | 0.01ms | 0.01ms | -0.00017ms | -1.16% |
| p95 | 0.03ms | 0.05ms | -0.03ms | -52.35% |
| p99 | 0.07ms | 0.14ms | -0.07ms | -50.98% |
| mean | 0.02ms | 0.02ms | -0.0044ms | -21.04% |
| min | 0.01ms | 0.01ms | -0.00037ms | -2.86% |
| max | 0.12ms | 0.17ms | -0.05ms | -29.52% |
| total | 3.31ms | 4.19ms | -0.88ms | -21.04% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0082ms |
| p50 | 0.0089ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0080ms |
| max | 0.10ms |
| total | 2.33ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0078ms | +0.00037ms | +4.74% |
| p50 | 0.0089ms | 0.0081ms | +0.00079ms | +9.79% |
| p95 | 0.02ms | 0.02ms | -0.00057ms | -2.92% |
| p99 | 0.07ms | 0.04ms | +0.02ms | +48.76% |
| mean | 0.01ms | 0.01ms | +0.00090ms | +8.42% |
| min | 0.0080ms | 0.0076ms | +0.00033ms | +4.37% |
| max | 0.10ms | 0.19ms | -0.09ms | -45.97% |
| total | 2.33ms | 2.14ms | +0.18ms | +8.42% |

