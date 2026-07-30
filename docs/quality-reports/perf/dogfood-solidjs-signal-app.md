# Perf Suite — dogfood-solidjs-signal-app

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveCounter | 0.0092ms | 0.03ms | 50ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveTodos | 0.01ms | 0.03ms | 80ms | 0.00032ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveResource | 0.0033ms | 0.01ms | 100ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveSuspense | 1.16ms | 1.24ms | 150ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveCounter | cpu | 0.08ms | 0.09ms | 0.0092ms | 0.114 | 0.108 | 0.0092ms | 0.0087ms |
| driveTodos | cpu | 0.08ms | 0.09ms | 0.01ms | 0.180 | 0.179 | 0.01ms | 0.01ms |
| driveResource | cpu | 0.08ms | 0.08ms | 0.0033ms | 0.041 | 0.041 | 0.0033ms | 0.0033ms |
| driveSuspense | cpu | 0.08ms | 0.10ms | 1.16ms | 14.134 | 14.083 | 1.16ms | 1.15ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveCounter | 0.17ms | 100ms | PASS |
| driveTodos | 0.25ms | 160ms | PASS |
| driveResource | 0.06ms | 200ms | PASS |
| driveSuspense | 1.29ms | 300ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveCounter | -3664 B | 0 B | 102400 B | yes | PASS |
| driveTodos | 6184 B | 0 B | 102400 B | yes | PASS |
| driveResource | 2408 B | 0 B | 102400 B | yes | PASS |
| driveSuspense | -416 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveCounter

# Perf Report — driveCounter.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.02ms |
| min | 0.0087ms |
| max | 0.20ms |
| total | 2.97ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0087ms | +0.00046ms | +5.28% |
| p50 | 0.01ms | 0.01ms | +0.00058ms | +5.23% |
| p95 | 0.03ms | 0.03ms | -0.00027ms | -1.05% |
| p99 | 0.07ms | 0.05ms | +0.02ms | +43.72% |
| mean | 0.01ms | 0.01ms | +0.0011ms | +7.98% |
| min | 0.0086ms | 0.0082ms | +0.00042ms | +5.17% |
| max | 0.19ms | 0.16ms | +0.03ms | +17.58% |
| total | 2.94ms | 2.72ms | +0.22ms | +7.98% |

### driveTodos

# Perf Report — driveTodos.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.08ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.18ms |
| total | 3.79ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.978)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.000053ms | +0.37% |
| p50 | 0.02ms | 0.02ms | -0.00040ms | -2.59% |
| p95 | 0.03ms | 0.03ms | +0.000077ms | +0.25% |
| p99 | 0.07ms | 0.07ms | +0.0059ms | +8.59% |
| mean | 0.02ms | 0.02ms | -0.00015ms | -0.82% |
| min | 0.01ms | 0.01ms | -0.00010ms | -0.74% |
| max | 0.18ms | 0.15ms | +0.02ms | +15.40% |
| total | 3.71ms | 3.74ms | -0.03ms | -0.82% |

### driveResource

# Perf Report — driveResource.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0033ms |
| p50 | 0.0044ms |
| p95 | 0.01ms |
| p99 | 0.04ms |
| mean | 0.0060ms |
| stdev | 0.0069ms |
| min | 0.0032ms |
| max | 0.06ms |
| total | 1.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.991)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0033ms | 0.0033ms | +0.000016ms | +0.50% |
| p50 | 0.0043ms | 0.0044ms | -0.00010ms | -2.26% |
| p95 | 0.01ms | 0.01ms | +0.00092ms | +7.72% |
| p99 | 0.04ms | 0.03ms | +0.0096ms | +32.65% |
| mean | 0.0059ms | 0.0056ms | +0.00034ms | +6.18% |
| min | 0.0031ms | 0.0031ms | +0.000015ms | +0.47% |
| max | 0.06ms | 0.05ms | +0.0094ms | +17.46% |
| total | 1.18ms | 1.11ms | +0.07ms | +6.18% |

### driveSuspense

# Perf Report — driveSuspense.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 1.16ms |
| p50 | 1.18ms |
| p95 | 1.24ms |
| p99 | 1.31ms |
| mean | 1.15ms |
| stdev | 0.20ms |
| min | 0.02ms |
| max | 1.45ms |
| total | 230.58ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.999)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 1.16ms | 1.15ms | +0.0041ms | +0.36% |
| p50 | 1.17ms | 1.18ms | -0.0068ms | -0.57% |
| p95 | 1.24ms | 1.24ms | +0.0031ms | +0.25% |
| p99 | 1.31ms | 1.61ms | -0.30ms | -18.78% |
| mean | 1.15ms | 1.13ms | +0.02ms | +1.93% |
| min | 0.02ms | 0.02ms | +0.0033ms | +15.67% |
| max | 1.45ms | 1.82ms | -0.37ms | -20.22% |
| total | 230.24ms | 225.89ms | +4.35ms | +1.93% |

