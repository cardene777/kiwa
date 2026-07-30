# Perf Suite — dogfood-hono-workers-rpc

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| driveRoute | 0.02ms | 0.07ms | 80ms | 0.00032ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveKv | 0.02ms | 0.07ms | 80ms | 0.00032ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +120% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveD1 | 0.01ms | 0.02ms | 80ms | 0.00031ms | PASS | stable — gate 無効 (regressionGate=false) |
| driveR2 | 0.02ms | 0.03ms | 100ms | 0.00031ms | PASS | stable (換算後 p10 +13% (閾値未満)、 p95 +38% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| driveExecutionCtx | 0.0086ms | 0.08ms | 50ms | 0.00032ms | PASS | stable (換算後 p10 +2% (閾値未満)、 p95 +506% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| driveRoute | cpu | 0.09ms | 0.12ms | 0.02ms | 0.244 | 0.241 | 0.02ms | 0.02ms |
| driveKv | cpu | 0.09ms | 0.12ms | 0.02ms | 0.217 | 0.214 | 0.02ms | 0.02ms |
| driveD1 | cpu | 0.09ms | 0.09ms | 0.01ms | 0.153 | 0.157 | 0.01ms | 0.01ms |
| driveR2 | cpu | 0.09ms | 0.09ms | 0.02ms | 0.189 | 0.168 | 0.02ms | 0.01ms |
| driveExecutionCtx | cpu | 0.09ms | 0.16ms | 0.0086ms | 0.099 | 0.097 | 0.0082ms | 0.0080ms |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| driveRoute | 1.33ms | 160ms | PASS |
| driveKv | 0.41ms | 160ms | PASS |
| driveD1 | 0.28ms | 160ms | PASS |
| driveR2 | 0.37ms | 200ms | PASS |
| driveExecutionCtx | 0.31ms | 100ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| driveRoute | -2440 B | 0 B | 102400 B | yes | PASS |
| driveKv | -51144 B | 0 B | 102400 B | yes | PASS |
| driveD1 | 1440 B | 0 B | 102400 B | yes | PASS |
| driveR2 | 6392 B | 0 B | 102400 B | yes | PASS |
| driveExecutionCtx | -304 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### driveRoute

# Perf Report — driveRoute.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.13ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.56ms |
| total | 6.88ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.955)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00032ms | +1.61% |
| p50 | 0.02ms | 0.02ms | -0.000061ms | -0.27% |
| p95 | 0.07ms | 0.05ms | +0.01ms | +27.76% |
| p99 | 0.12ms | 0.10ms | +0.03ms | +25.70% |
| mean | 0.03ms | 0.03ms | +0.0019ms | +6.29% |
| min | 0.02ms | 0.02ms | +0.0018ms | +10.88% |
| max | 0.54ms | 0.91ms | -0.37ms | -40.66% |
| total | 6.57ms | 6.19ms | +0.39ms | +6.29% |

### driveKv

# Perf Report — driveKv.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.07ms |
| p99 | 0.20ms |
| mean | 0.03ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.47ms |
| total | 6.05ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.951)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | +0.00028ms | +1.61% |
| p50 | 0.02ms | 0.02ms | -0.000097ms | -0.50% |
| p95 | 0.07ms | 0.03ms | +0.04ms | +119.80% |
| p99 | 0.19ms | 0.06ms | +0.13ms | +217.92% |
| mean | 0.03ms | 0.02ms | +0.0067ms | +30.27% |
| min | 0.02ms | 0.02ms | -0.000086ms | -0.50% |
| max | 0.45ms | 0.12ms | +0.33ms | +272.95% |
| total | 5.75ms | 4.41ms | +1.34ms | +30.27% |

### driveD1

# Perf Report — driveD1.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0072ms |
| min | 0.01ms |
| max | 0.09ms |
| total | 3.14ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.939)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00031ms | -2.41% |
| p50 | 0.01ms | 0.01ms | -0.00020ms | -1.49% |
| p95 | 0.02ms | 0.02ms | +0.0010ms | +5.23% |
| p99 | 0.04ms | 0.04ms | -0.0022ms | -5.53% |
| mean | 0.01ms | 0.01ms | -0.000020ms | -0.14% |
| min | 0.01ms | 0.01ms | -0.00040ms | -3.24% |
| max | 0.08ms | 0.07ms | +0.01ms | +21.78% |
| total | 2.95ms | 2.95ms | -0.0040ms | -0.14% |

### driveR2

# Perf Report — driveR2.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.02ms |
| max | 0.19ms |
| total | 4.23ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.925)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.01ms | +0.0018ms | +12.67% |
| p50 | 0.02ms | 0.01ms | +0.0024ms | +16.33% |
| p95 | 0.03ms | 0.02ms | +0.0081ms | +37.65% |
| p99 | 0.06ms | 0.05ms | +0.01ms | +23.45% |
| mean | 0.02ms | 0.02ms | +0.0024ms | +14.13% |
| min | 0.01ms | 0.01ms | +0.00056ms | +4.10% |
| max | 0.18ms | 0.32ms | -0.14ms | -44.47% |
| total | 3.91ms | 3.43ms | +0.48ms | +14.13% |

### driveExecutionCtx

# Perf Report — driveExecutionCtx.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0086ms |
| p50 | 0.0093ms |
| p95 | 0.08ms |
| p99 | 0.22ms |
| mean | 0.03ms |
| stdev | 0.13ms |
| min | 0.0083ms |
| max | 1.77ms |
| total | 5.83ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.960)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0080ms | +0.00019ms | +2.36% |
| p50 | 0.0089ms | 0.0084ms | +0.00052ms | +6.22% |
| p95 | 0.08ms | 0.01ms | +0.07ms | +505.75% |
| p99 | 0.21ms | 0.02ms | +0.19ms | +1135.18% |
| mean | 0.03ms | 0.0089ms | +0.02ms | +214.32% |
| min | 0.0080ms | 0.0077ms | +0.00029ms | +3.75% |
| max | 1.70ms | 0.03ms | +1.67ms | +6253.49% |
| total | 5.59ms | 1.78ms | +3.81ms | +214.32% |

