# Perf Suite — expo

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| createExpoTestEnv | 0.00087ms | 0.0094ms | 5ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| routerPushCycle | 0.00050ms | 0.0015ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| notificationDispatch | 0.00042ms | 0.0028ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| createExpoTestEnv | cpu | 0.08ms | 0.10ms | 0.00087ms | 0.011 | 0.010 | 0.00085ms | 0.00083ms |
| routerPushCycle | cpu | 0.08ms | 0.10ms | 0.00050ms | 0.006 | 0.006 | 0.00050ms | 0.00050ms |
| notificationDispatch | cpu | 0.08ms | 0.09ms | 0.00042ms | 0.005 | 0.006 | 0.00041ms | 0.00046ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| createExpoTestEnv | 0.04ms | 10ms | PASS |
| routerPushCycle | 0.02ms | 10ms | PASS |
| notificationDispatch | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| createExpoTestEnv | -4520 B | -48342 B | 102400 B | yes | PASS |
| routerPushCycle | -15008 B | 0 B | 102400 B | yes | PASS |
| notificationDispatch | 624 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### createExpoTestEnv

# Perf Report — createExpoTestEnv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00087ms |
| p50 | 0.00092ms |
| p95 | 0.0094ms |
| p99 | 0.03ms |
| mean | 0.0025ms |
| stdev | 0.0053ms |
| min | 0.00079ms |
| max | 0.04ms |
| total | 0.50ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.975)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00085ms | 0.00083ms | +0.000016ms | +1.97% |
| p50 | 0.00089ms | 0.0010ms | -0.00011ms | -10.57% |
| p95 | 0.0092ms | 0.0077ms | +0.0015ms | +19.45% |
| p99 | 0.03ms | 0.02ms | +0.0098ms | +48.71% |
| mean | 0.0024ms | 0.0023ms | +0.00015ms | +6.72% |
| min | 0.00077ms | 0.00079ms | -0.000019ms | -2.35% |
| max | 0.04ms | 0.03ms | +0.0093ms | +28.36% |
| total | 0.49ms | 0.46ms | +0.03ms | +6.72% |

### routerPushCycle

# Perf Report — routerPushCycle.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00050ms |
| p50 | 0.00054ms |
| p95 | 0.0015ms |
| p99 | 0.0066ms |
| mean | 0.00080ms |
| stdev | 0.0017ms |
| min | 0.00046ms |
| max | 0.02ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.006)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00050ms | 0.00050ms | +0.0000028ms | +0.57% |
| p50 | 0.00054ms | 0.00054ms | +0.0000021ms | +0.38% |
| p95 | 0.0015ms | 0.0015ms | -8.5e-8ms | -0.01% |
| p99 | 0.0067ms | 0.0060ms | +0.00066ms | +10.93% |
| mean | 0.00081ms | 0.00084ms | -0.000038ms | -4.55% |
| min | 0.00046ms | 0.00046ms | +0.0000026ms | +0.57% |
| max | 0.02ms | 0.02ms | +0.0028ms | +14.52% |
| total | 0.16ms | 0.17ms | -0.0077ms | -4.55% |

### notificationDispatch

# Perf Report — notificationDispatch.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00042ms |
| p50 | 0.00046ms |
| p95 | 0.0028ms |
| p99 | 0.01ms |
| mean | 0.0010ms |
| stdev | 0.0025ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.994)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00041ms | 0.00046ms | -0.000044ms | -9.67% |
| p50 | 0.00046ms | 0.00050ms | -0.000045ms | -8.91% |
| p95 | 0.0028ms | 0.0036ms | -0.00080ms | -22.60% |
| p99 | 0.01ms | 0.01ms | +0.0016ms | +13.25% |
| mean | 0.0010ms | 0.0011ms | -0.00010ms | -9.32% |
| min | 0.00037ms | 0.00042ms | -0.000043ms | -10.36% |
| max | 0.02ms | 0.03ms | -0.01ms | -32.41% |
| total | 0.20ms | 0.22ms | -0.02ms | -9.32% |

